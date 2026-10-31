package sales

import (
	"context"
	"errors"
	"log/slog"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/accounting"
	"github.com/jalusw/swantara/apps/service/internal/contacts"
	"github.com/jalusw/swantara/apps/service/internal/crm"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/inventory"
	"github.com/jalusw/swantara/apps/service/internal/kernel/amount"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/kernel/scope"
	"github.com/jalusw/swantara/apps/service/internal/kernel/sequence"
	"github.com/jalusw/swantara/apps/service/internal/kernel/state"
	"github.com/jalusw/swantara/apps/service/internal/products"
	"github.com/jalusw/swantara/apps/service/internal/reference"

	"github.com/jalusw/swantara/apps/service/internal/kernel/clock"
)

type SaleOrderService struct {
	orders         SaleOrderDAO
	lines          SaleOrderLineDAO
	quotes         SaleQuoteDAO
	quoteLines     SaleQuoteLineDAO
	sequences      sequence.Service
	productSvc     products.ProductService
	price_books    products.PriceBookDAO
	taxes          dao.CRUD[reference.Tax]
	contacts       contacts.ContactDAO
	leads          crm.ProspectDAO
	stages         dao.CRUD[reference.PipelineStage]
	warehouses     inventory.WarehouseDAO
	locations      inventory.StockLocationDAO
	quants         inventory.StockBalanceDAO
	shipments      inventory.ShipmentDAO
	movements      inventory.StockMovementDAO
	reservations   inventory.StockHoldDAO
	reservationSvc inventory.HoldService
	ship           ShipEngine
	invoices       InvoiceEngine
	openInvoices   InvoiceLookup
	payments       PaymentEngine
	controls       *SalesControls
	machine        state.Machine
	now            func() time.Time
}

// SaleOrderRepositories groups the persistence dependencies of the sale order service.
type SaleOrderRepositories struct {
	Orders       SaleOrderDAO
	Lines        SaleOrderLineDAO
	Quotes       SaleQuoteDAO
	QuoteLines   SaleQuoteLineDAO
	PriceBooks   products.PriceBookDAO
	Taxes        dao.CRUD[reference.Tax]
	Contacts     contacts.ContactDAO
	Leads        crm.ProspectDAO
	Stages       dao.CRUD[reference.PipelineStage]
	Warehouses   inventory.WarehouseDAO
	Locations    inventory.StockLocationDAO
	Quants       inventory.StockBalanceDAO
	Shipments    inventory.ShipmentDAO
	Movements    inventory.StockMovementDAO
	Reservations inventory.StockHoldDAO
}

// SaleOrderEngines groups the business collaborators of the sale order service.
type SaleOrderEngines struct {
	Sequences      sequence.Service
	Product        products.ProductService
	ReservationSvc inventory.HoldService
	Ship           ShipEngine
	Invoices       InvoiceEngine
	OpenInvoices   InvoiceLookup
	Payments       PaymentEngine
}

func NewSaleOrderService(repos SaleOrderRepositories, engines SaleOrderEngines) SaleOrderService {
	return SaleOrderService{
		now:            clock.Now,
		orders:         repos.Orders,
		lines:          repos.Lines,
		quotes:         repos.Quotes,
		quoteLines:     repos.QuoteLines,
		price_books:    repos.PriceBooks,
		taxes:          repos.Taxes,
		contacts:       repos.Contacts,
		leads:          repos.Leads,
		stages:         repos.Stages,
		warehouses:     repos.Warehouses,
		locations:      repos.Locations,
		quants:         repos.Quants,
		shipments:      repos.Shipments,
		movements:      repos.Movements,
		reservations:   repos.Reservations,
		sequences:      engines.Sequences,
		productSvc:     engines.Product,
		reservationSvc: engines.ReservationSvc,
		ship:           engines.Ship,
		invoices:       engines.Invoices,
		openInvoices:   engines.OpenInvoices,
		payments:       engines.Payments,
		machine: state.NewMachine(
			state.Transition{From: model.Status(OrderStateDraft), To: model.Status(OrderStateSent)},
			state.Transition{From: model.Status(OrderStateDraft), To: model.Status(OrderStateConfirmed)},
			state.Transition{From: model.Status(OrderStateDraft), To: model.Status(OrderStateCancelled)},
			state.Transition{From: model.Status(OrderStateSent), To: model.Status(OrderStateConfirmed)},
			state.Transition{From: model.Status(OrderStateSent), To: model.Status(OrderStateCancelled)},
			state.Transition{From: model.Status(OrderStateConfirmed), To: model.Status(OrderStateDone)},
			state.Transition{From: model.Status(OrderStateConfirmed), To: model.Status(OrderStateCancelled)},
		),
	}
}

func (s SaleOrderService) WithClock(now func() time.Time) SaleOrderService {
	s.now = now
	return s
}

func (s SaleOrderService) WithControls(controls SalesControls) SaleOrderService {
	s.controls = &controls
	return s
}

func (s SaleOrderService) Create(ctx context.Context, order *SaleOrder, lines []*SaleOrderLine) (*SaleOrder, error) {
	if order.OrganizationID == nil {
		return nil, ErrOrderContact
	}
	if order.QuoteID != nil {
		if err := s.applyQuote(ctx, order, &lines); err != nil {
			return nil, err
		}
	}
	if len(lines) == 0 {
		return nil, ErrOrderNoLines
	}
	if order.WarehouseID == nil {
		return nil, ErrOrderWarehouse
	}
	if order.PriceBookID == nil {
		return nil, ErrOrderPriceBook
	}
	if err := s.validateContact(ctx, order.OrganizationID, order.ContactID); err != nil {
		return nil, err
	}
	if err := s.validateWarehouse(ctx, order.OrganizationID, *order.WarehouseID); err != nil {
		return nil, err
	}
	if err := s.validatePriceBook(ctx, order.OrganizationID, *order.PriceBookID); err != nil {
		return nil, err
	}
	if order.ProspectID != nil {
		if order.QuoteID != nil {
			if err := s.validateConversionLead(ctx, *order.OrganizationID, *order.ProspectID); err != nil {
				return nil, err
			}
		} else if err := s.validateWonLead(ctx, *order.OrganizationID, *order.ProspectID); err != nil {
			return nil, err
		}
	}
	if err := s.validateSingleOpportunityOrder(ctx, order); err != nil {
		return nil, err
	}

	date := s.now()
	if order.OrderDate != nil {
		date = *order.OrderDate
	}

	untaxed := amount.Zero()
	tax := amount.Zero()
	for _, line := range lines {
		if line.ItemID == nil {
			return nil, ErrOrderVariant
		}
		if !amount.FromFloat64(line.QtyOrdered).GreaterThan(amount.Zero()) {
			return nil, ErrOrderQty
		}
		if line.DiscountPct < 0 || line.DiscountPct > 100 {
			return nil, ErrOrderDiscount
		}
		if err := s.validateLineProduct(ctx, order.OrganizationID, *line.ItemID); err != nil {
			return nil, err
		}
		if line.UnitPrice == 0 {
			resolved, err := s.productSvc.ResolvePrice(ctx, *order.PriceBookID, *line.ItemID, amount.FromFloat64(line.QtyOrdered), date)
			if err != nil {
				return nil, err
			}
			line.UnitPrice = resolved.Price.Float64()
		}
		if err := s.resolveLineAmounts(ctx, order.OrganizationID, line); err != nil {
			return nil, err
		}
		untaxed = untaxed.Add(amount.FromFloat64(line.PriceSubtotal))
		tax = tax.Add(amount.FromFloat64(line.PriceTax))
	}

	name, err := s.sequences.Next(ctx, *order.OrganizationID, SequenceSaleOrderCode)
	if err != nil {
		if errors.Is(err, sequence.ErrSequenceNotFound) {
			return nil, ErrOrderSequenceNotFound
		}
		return nil, err
	}
	order.Name = helper.Ptr(name)
	order.AmountUntaxed = untaxed.Round(4).Float64()
	order.AmountTax = tax.Round(4).Float64()
	order.AmountTotal = untaxed.Add(tax).Round(4).Float64()
	order.State = OrderStateDraft
	order.InvoiceStatus = InvoiceStatusNo
	order.DeliveryStatus = DeliveryStatusPending

	created, err := s.orders.CreateWithLines(ctx, order, lines)
	if err != nil {
		return nil, err
	}
	if order.QuoteID != nil && s.quotes != nil {
		if quote, findErr := s.quotes.Find(ctx, *order.QuoteID); findErr == nil && quote != nil {
			quote.SaleOrderID = helper.Ptr(created.ID)
			if _, updateErr := s.quotes.Update(ctx, quote); updateErr != nil {
				return nil, updateErr
			}
		}
	}
	return created, nil
}

func (s SaleOrderService) UpdateDraft(ctx context.Context, orderID uint64, order *SaleOrder, lines []*SaleOrderLine) (*SaleOrder, error) {
	existing, err := s.orders.Find(ctx, orderID)
	if err != nil {
		return nil, dao.NotFound(err, ErrOrderNotFound)
	}
	if existing == nil {
		return nil, ErrOrderNotFound
	}
	if existing.State != OrderStateDraft {
		return nil, ErrOrderState
	}
	if len(lines) == 0 {
		return nil, ErrOrderNoLines
	}
	if order.WarehouseID == nil {
		return nil, ErrOrderWarehouse
	}
	if order.PriceBookID == nil {
		return nil, ErrOrderPriceBook
	}
	if err := s.validateContact(ctx, existing.OrganizationID, order.ContactID); err != nil {
		return nil, err
	}
	if err := s.validateWarehouse(ctx, existing.OrganizationID, *order.WarehouseID); err != nil {
		return nil, err
	}
	if err := s.validatePriceBook(ctx, existing.OrganizationID, *order.PriceBookID); err != nil {
		return nil, err
	}

	date := s.now()
	if order.OrderDate != nil {
		date = *order.OrderDate
	}

	untaxed := amount.Zero()
	tax := amount.Zero()
	for _, line := range lines {
		if line.ItemID == nil {
			return nil, ErrOrderVariant
		}
		if !amount.FromFloat64(line.QtyOrdered).GreaterThan(amount.Zero()) {
			return nil, ErrOrderQty
		}
		if line.DiscountPct < 0 || line.DiscountPct > 100 {
			return nil, ErrOrderDiscount
		}
		if err := s.validateLineProduct(ctx, existing.OrganizationID, *line.ItemID); err != nil {
			return nil, err
		}
		if line.UnitPrice == 0 {
			resolved, err := s.productSvc.ResolvePrice(ctx, *order.PriceBookID, *line.ItemID, amount.FromFloat64(line.QtyOrdered), date)
			if err != nil {
				return nil, err
			}
			line.UnitPrice = resolved.Price.Float64()
		}
		if err := s.resolveLineAmounts(ctx, existing.OrganizationID, line); err != nil {
			return nil, err
		}
		untaxed = untaxed.Add(amount.FromFloat64(line.PriceSubtotal))
		tax = tax.Add(amount.FromFloat64(line.PriceTax))
	}

	order.ID = existing.ID
	order.OrganizationID = existing.OrganizationID
	order.Name = existing.Name
	order.CurrencyCode = existing.CurrencyCode
	order.ProspectID = existing.ProspectID
	order.QuoteID = existing.QuoteID
	order.State = OrderStateDraft
	order.AmountUntaxed = untaxed.Round(4).Float64()
	order.AmountTax = tax.Round(4).Float64()
	order.AmountTotal = untaxed.Add(tax).Round(4).Float64()
	order.InvoiceStatus = InvoiceStatusNo
	order.DeliveryStatus = DeliveryStatusPending

	if err := s.lines.ReplaceLines(ctx, orderID, lines); err != nil {
		return nil, err
	}
	updated, err := s.orders.Update(ctx, order)
	if err != nil {
		return nil, err
	}
	if s.controls != nil {
		if err := s.controls.Invalidate(ctx, ApprovalOwnerTypeSaleOrder, orderID); err != nil {
			return nil, err
		}
	}
	return updated, nil
}

func (s SaleOrderService) Send(ctx context.Context, orderID uint64) (*SaleOrder, error) {
	order, err := s.findOrder(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if err := s.machine.TryTransition(model.Status(order.State), model.Status(OrderStateSent)); err != nil {
		return nil, ErrOrderState
	}
	order.State = OrderStateSent
	return s.orders.Update(ctx, order)
}

func (s SaleOrderService) Confirm(ctx context.Context, orderID uint64) (*SaleOrder, error) {
	order, err := s.findOrder(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if err := s.machine.TryTransition(model.Status(order.State), model.Status(OrderStateConfirmed)); err != nil {
		return nil, ErrOrderState
	}
	if order.WarehouseID == nil {
		return nil, ErrOrderWarehouse
	}

	lines, err := s.lines.ListByOrder(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if len(lines) == 0 {
		return nil, ErrOrderNoLines
	}
	if s.controls != nil && order.OrganizationID != nil {
		if err := s.controls.Enforce(ctx, *order.OrganizationID, ApprovalOwnerTypeSaleOrder, order.ID, order.ContactID, order.AmountTotal, order.PaymentTermID, maxSalesLineDiscount(lines)); err != nil {
			return nil, err
		}
	}

	stockLocationID, err := s.warehouseStockLocation(ctx, order.OrganizationID, *order.WarehouseID)
	if err != nil {
		return nil, err
	}
	customerLocationID, err := s.customerLocation(ctx, order.OrganizationID)
	if err != nil {
		return nil, err
	}

	for _, line := range lines {
		if line.ItemID == nil {
			continue
		}
		quant, err := s.quants.FindByKey(ctx, *line.ItemID, stockLocationID, nil)
		if err != nil {
			return nil, err
		}
		available := amount.Zero()
		if quant != nil {
			available = amount.FromFloat64(quant.Quantity).Sub(amount.FromFloat64(quant.ReservedQty))
		}
		if amount.FromFloat64(line.QtyOrdered).GreaterThan(available) {
			return nil, ErrOrderStockUnavailable
		}
	}

	movements := make([]*inventory.StockMovement, 0, len(lines))
	for _, line := range lines {
		if line.ItemID == nil {
			continue
		}
		movements = append(movements, &inventory.StockMovement{
			OrganizationID: order.OrganizationID,
			ItemID:         *line.ItemID,
			Qty:            line.QtyOrdered,
			UnitID:         line.UnitID,
			SrcLocationID:  stockLocationID,
			DstLocationID:  customerLocationID,
			State:          inventory.MovementStateConfirmed,
			OriginType:     helper.Ptr(accounting.OriginTypeSaleOrder),
			OriginID:       helper.Ptr(order.ID),
			ScheduledDate:  order.ExpectedDate,
		})
	}

	shipment := &inventory.Shipment{
		OrganizationID: order.OrganizationID,
		Name:           order.Name,
		Type:           inventory.ShipmentTypeOutgoing,
		ContactID:      helper.Ptr(order.ContactID),
		SrcLocationID:  helper.Ptr(stockLocationID),
		DstLocationID:  helper.Ptr(customerLocationID),
		State:          inventory.ShipmentStateConfirmed,
		Origin:         order.Name,
		ScheduledDate:  order.ExpectedDate,
	}

	created, err := s.shipments.CreateWithMovements(ctx, shipment, movements)
	if err != nil {
		return nil, err
	}

	reserved := make([]uint64, 0, len(movements))
	for _, movement := range movements {
		if _, err := s.reservationSvc.Reserve(ctx, *order.OrganizationID, movement.ItemID, stockLocationID, nil, amount.FromFloat64(movement.Qty), &movement.ID); err != nil {
			s.rollbackReservations(ctx, reserved)
			s.cancelShipment(ctx, created.ID)
			return nil, err
		}
		reserved = append(reserved, movement.ID)
		movement.State = inventory.MovementStateAssigned
		if _, err := s.movements.Update(ctx, movement); err != nil {
			s.rollbackReservations(ctx, reserved)
			s.cancelShipment(ctx, created.ID)
			return nil, err
		}
	}

	created.State = inventory.ShipmentStateAssigned
	if _, err := s.shipments.Update(ctx, created); err != nil {
		s.rollbackReservations(ctx, reserved)
		s.cancelShipment(ctx, created.ID)
		return nil, err
	}

	recomputeStatuses(order, lines)
	order.State = OrderStateConfirmed
	return s.orders.Update(ctx, order)
}

func (s SaleOrderService) Cancel(ctx context.Context, orderID uint64) (*SaleOrder, error) {
	order, err := s.findOrder(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if err := s.machine.TryTransition(model.Status(order.State), model.Status(OrderStateCancelled)); err != nil {
		return nil, ErrOrderState
	}
	if order.Name == nil {
		return nil, ErrOrderNotFound
	}

	shipments, err := s.shipments.List(ctx, &query.Query{Filters: []query.Filter{{Field: "origin", Operator: query.Equal, Value: *order.Name}}})
	if err != nil {
		return nil, err
	}
	for _, shipment := range shipments.Items {
		s.cancelShipment(ctx, shipment.ID)
	}

	order.State = OrderStateCancelled
	return s.orders.Update(ctx, order)
}

func (s SaleOrderService) Done(ctx context.Context, orderID uint64) (*SaleOrder, error) {
	order, err := s.findOrder(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if err := s.machine.TryTransition(model.Status(order.State), model.Status(OrderStateDone)); err != nil {
		return nil, ErrOrderState
	}
	order.State = OrderStateDone
	return s.orders.Update(ctx, order)
}

func (s SaleOrderService) ListLines(ctx context.Context, orderID uint64) ([]*SaleOrderLine, error) {
	return s.lines.ListByOrder(ctx, orderID)
}

func (s SaleOrderService) List(ctx context.Context, q *query.Query) (*query.Page[SaleOrder], error) {
	return s.orders.List(ctx, q)
}

func (s SaleOrderService) Find(ctx context.Context, id uint64) (*SaleOrder, error) {
	return s.findOrder(ctx, id)
}

func (s SaleOrderService) Delete(ctx context.Context, id uint64) error {
	return s.orders.Delete(ctx, id)
}

func (s SaleOrderService) RecomputeStatuses(ctx context.Context, orderID uint64) (*SaleOrder, error) {
	order, err := s.findOrder(ctx, orderID)
	if err != nil {
		return nil, err
	}
	lines, err := s.lines.ListByOrder(ctx, orderID)
	if err != nil {
		return nil, err
	}
	recomputeStatuses(order, lines)
	return s.orders.Update(ctx, order)
}

func (s SaleOrderService) RecordReturn(ctx context.Context, orderID, itemID uint64, qty float64) error {
	order, err := s.findOrder(ctx, orderID)
	if err != nil {
		return err
	}
	lines, err := s.lines.ListByOrder(ctx, orderID)
	if err != nil {
		return err
	}
	found := false
	for _, line := range lines {
		if line.ItemID != nil && *line.ItemID == itemID {
			line.QtyReturns = amount.FromFloat64(line.QtyReturns).Add(amount.FromFloat64(qty)).Round(4).Float64()
			if _, err := s.lines.Update(ctx, line); err != nil {
				return err
			}
			found = true
			break
		}
	}
	if !found {
		return ErrLineNotFound
	}
	recomputeStatuses(order, lines)
	_, err = s.orders.Update(ctx, order)
	return err
}

func recomputeStatuses(order *SaleOrder, lines []*SaleOrderLine) {
	ordered, delivered, invoiced, returned := amount.Zero(), amount.Zero(), amount.Zero(), amount.Zero()
	for _, line := range lines {
		ordered = ordered.Add(amount.FromFloat64(line.QtyOrdered))
		delivered = delivered.Add(amount.FromFloat64(line.QtyDelivered))
		invoiced = invoiced.Add(amount.FromFloat64(line.QtyInvoiced))
		returned = returned.Add(amount.FromFloat64(line.QtyReturns))
	}

	netDelivered := delivered.Sub(returned)
	switch {
	case !netDelivered.IsPositive():
		order.DeliveryStatus = DeliveryStatusPending
	case netDelivered.Equal(ordered):
		order.DeliveryStatus = DeliveryStatusDone
	default:
		order.DeliveryStatus = DeliveryStatusPartial
	}

	netInvoiced := invoiced.Sub(returned)
	switch {
	case !netInvoiced.IsPositive():
		order.InvoiceStatus = InvoiceStatusNo
	case netInvoiced.Equal(ordered):
		order.InvoiceStatus = InvoiceStatusInvoiced
	default:
		order.InvoiceStatus = InvoiceStatusToInvoice
	}
}

func (s SaleOrderService) findOrder(ctx context.Context, orderID uint64) (*SaleOrder, error) {
	order, err := s.orders.Find(ctx, orderID)
	if err != nil {
		return nil, dao.NotFound(err, ErrOrderNotFound)
	}
	if order == nil {
		return nil, ErrOrderNotFound
	}
	return order, nil
}

func (s SaleOrderService) applyQuote(ctx context.Context, order *SaleOrder, lines *[]*SaleOrderLine) error {
	if s.quotes == nil {
		return ErrQuoteNotFound
	}
	quote, err := s.quotes.Find(ctx, *order.QuoteID)
	if err != nil {
		return dao.NotFound(err, ErrQuoteNotFound)
	}
	if quote == nil || !scope.Owns(quote.OrganizationID, *order.OrganizationID) {
		return ErrQuoteNotFound
	}
	if quote.State != QuoteStateAccepted {
		return ErrQuoteNotAccepted
	}
	if quote.SaleOrderID != nil {
		return ErrQuoteAlreadyConverted
	}
	if quote.ValidityDate != nil {
		today := s.now().UTC().Truncate(24 * time.Hour)
		if quote.ValidityDate.Before(today) {
			return ErrQuoteExpired
		}
	}

	if order.ContactID == 0 {
		order.ContactID = quote.ContactID
	}
	if order.PriceBookID == nil {
		order.PriceBookID = quote.PriceBookID
	}
	if order.ProspectID == nil {
		order.ProspectID = quote.ProspectID
	}
	if order.CurrencyCode == nil {
		order.CurrencyCode = quote.CurrencyCode
	}
	if order.SalespersonID == nil {
		order.SalespersonID = quote.SalespersonID
	}
	if order.SalesGroupID == nil {
		order.SalesGroupID = quote.SalesGroupID
	}
	if order.PaymentTermID == nil {
		order.PaymentTermID = quote.PaymentTermID
	}
	if order.Incoterm == nil {
		order.Incoterm = quote.Incoterm
	}
	if order.CustomerPORef == nil {
		order.CustomerPORef = quote.CustomerPORef
	}

	if len(*lines) != 0 {
		return nil
	}
	if s.quoteLines == nil {
		return ErrQuoteNoLines
	}
	quoteLines, err := s.quoteLines.ListByQuote(ctx, quote.ID)
	if err != nil {
		return err
	}
	for _, line := range quoteLines {
		*lines = append(*lines, &SaleOrderLine{
			Sequence:    line.Sequence,
			ItemID:      line.ItemID,
			Description: line.Description,
			QtyOrdered:  line.Qty,
			UnitID:      line.UnitID,
			UnitPrice:   line.UnitPrice,
			DiscountPct: line.DiscountPct,
			TaxIDs:      line.TaxIDs,
			DimensionID: line.DimensionID,
		})
	}
	return nil
}

func (s SaleOrderService) validateContact(ctx context.Context, organizationID *uint64, contactID uint64) error {
	contact, err := s.contacts.Find(ctx, contactID)
	if err != nil {
		return dao.NotFound(err, ErrOrderContact)
	}
	if contact == nil {
		return ErrOrderContact
	}
	if organizationID != nil && contact.OrganizationID != nil && *contact.OrganizationID != *organizationID {
		return ErrOrderContactOrganization
	}
	return nil
}

func (s SaleOrderService) validateWarehouse(ctx context.Context, organizationID *uint64, warehouseID uint64) error {
	warehouse, err := s.warehouses.Find(ctx, warehouseID)
	if err != nil {
		return dao.NotFound(err, ErrOrderWarehouse)
	}
	if warehouse == nil {
		return ErrOrderWarehouse
	}
	if !helper.OwnedByOrg(warehouse.OrganizationID, organizationID) {
		return ErrOrderWarehouseOrganization
	}
	return nil
}

func (s SaleOrderService) validatePriceBook(ctx context.Context, organizationID *uint64, price_bookID uint64) error {
	price_book, err := s.price_books.Find(ctx, price_bookID)
	if err != nil {
		return dao.NotFound(err, ErrOrderPriceBook)
	}
	if price_book == nil {
		return ErrOrderPriceBook
	}
	if organizationID != nil && price_book.OrganizationID != nil && *price_book.OrganizationID != *organizationID {
		return ErrOrderPriceBookOrganization
	}
	return nil
}

func (s SaleOrderService) validateLineProduct(ctx context.Context, organizationID *uint64, variantID uint64) error {
	variantOrg, err := s.productSvc.ResolveVariantOrganization(ctx, variantID)
	if err != nil {
		return err
	}
	if organizationID != nil && variantOrg != nil && *variantOrg != *organizationID {
		return ErrOrderVariantOrganization
	}
	return nil
}

func (s SaleOrderService) validateWonLead(ctx context.Context, organizationID, prospectID uint64) error {
	lead, err := s.leads.Find(ctx, prospectID)
	if err != nil {
		return dao.NotFound(err, ErrOrderLead)
	}
	if lead == nil {
		return ErrOrderLead
	}
	if lead.OrganizationID != nil && *lead.OrganizationID != organizationID {
		return ErrOrderLeadOrganization
	}
	if lead.Type != crm.ProspectKindOpportunity || lead.StageID == nil {
		return ErrOrderLeadNotWon
	}
	stage, err := s.stages.Find(ctx, *lead.StageID)
	if err != nil {
		return dao.NotFound(err, ErrOrderLeadNotWon)
	}
	if stage == nil || !stage.IsWon {
		return ErrOrderLeadNotWon
	}
	if lead.OrganizationID != nil && stage.OrganizationID != nil && *stage.OrganizationID != *lead.OrganizationID {
		return ErrOrderLeadNotWon
	}
	return nil
}

func (s SaleOrderService) validateConversionLead(ctx context.Context, organizationID, prospectID uint64) error {
	lead, err := s.leads.Find(ctx, prospectID)
	if err != nil {
		return dao.NotFound(err, ErrOrderLead)
	}
	if lead == nil {
		return ErrOrderLead
	}
	if lead.OrganizationID != nil && *lead.OrganizationID != organizationID {
		return ErrOrderLeadOrganization
	}
	if lead.Type != crm.ProspectKindOpportunity {
		return ErrOrderLeadNotWon
	}
	if lead.Status == crm.ProspectStatusLost || lead.Status == crm.ProspectStatusDisqualified || lead.LostReason != nil {
		return ErrOrderLeadLost
	}
	return nil
}

func (s SaleOrderService) validateSingleOpportunityOrder(ctx context.Context, order *SaleOrder) error {
	if order.ProspectID == nil || order.AllowMultipleOrders {
		return nil
	}
	page, err := s.orders.List(ctx, &query.Query{Filters: []query.Filter{
		{Field: "prospect_id", Operator: query.Equal, Value: *order.ProspectID},
		{Field: "state", Operator: query.NotEqual, Value: OrderStateCancelled},
	}})
	if err != nil {
		return err
	}
	if page != nil && len(page.Items) > 0 {
		return ErrOrderLeadAlreadyConverted
	}
	return nil
}

func (s SaleOrderService) resolveLineAmounts(ctx context.Context, organizationID *uint64, line *SaleOrderLine) error {
	qty := amount.FromFloat64(line.QtyOrdered)
	discount := amount.FromFloat64(1 - line.DiscountPct/100)
	subtotal := qty.Mul(amount.FromFloat64(line.UnitPrice)).Mul(discount).Round(4)
	lineTax := amount.Zero()

	for _, taxID := range line.TaxIDs {
		tax, err := s.taxes.Find(ctx, uint64(taxID))
		if err != nil {
			return dao.NotFound(err, ErrOrderTax)
		}
		if tax == nil {
			return ErrOrderTax
		}
		if organizationID != nil && tax.OrganizationID != nil && *tax.OrganizationID != *organizationID {
			return ErrOrderTaxOrganization
		}
		if tax.Scope != reference.TaxScopeSale && tax.Scope != reference.TaxScopeNone {
			return ErrOrderTaxInvalid
		}
		taxAmount, err := reference.TaxLineAmount(subtotal, qty, tax)
		if err != nil {
			return err
		}
		lineTax = lineTax.Add(taxAmount)
	}

	line.PriceSubtotal = subtotal.Float64()
	line.PriceTax = lineTax.Round(4).Float64()
	line.PriceTotal = subtotal.Add(lineTax).Round(4).Float64()
	return nil
}

func (s SaleOrderService) warehouseStockLocation(ctx context.Context, organizationID *uint64, warehouseID uint64) (uint64, error) {
	locations, err := s.locations.List(ctx, &query.Query{Filters: []query.Filter{{Field: "warehouse_id", Operator: query.Equal, Value: warehouseID}}})
	if err != nil {
		return 0, err
	}
	for _, location := range locations.Items {
		if location.Usage == "internal" && organizationID != nil && location.OrganizationID != nil && *location.OrganizationID == *organizationID {
			return location.ID, nil
		}
	}
	return 0, ErrOrderLocation
}

func (s SaleOrderService) customerLocation(ctx context.Context, organizationID *uint64) (uint64, error) {
	locations, err := s.locations.List(ctx, &query.Query{Filters: []query.Filter{{Field: "usage", Operator: query.Equal, Value: "customer"}}})
	if err != nil {
		return 0, err
	}
	for _, location := range locations.Items {
		if organizationID != nil && location.OrganizationID != nil && *location.OrganizationID == *organizationID {
			return location.ID, nil
		}
	}
	return 0, ErrOrderCustomerLocation
}

func (s SaleOrderService) rollbackReservations(ctx context.Context, moveIDs []uint64) {
	for _, moveID := range moveIDs {
		if err := s.reservations.ReleaseByMovement(ctx, moveID); err != nil {
			slog.Error("sale order reservation rollback failed", "movement_id", moveID, "error", err)
		}
	}
}

func (s SaleOrderService) cancelShipment(ctx context.Context, shipmentID uint64) {
	movements, err := s.movements.ListByShipment(ctx, shipmentID)
	if err != nil {
		slog.Error("sale order shipment cancel failed to list movements", "shipment_id", shipmentID, "error", err)
		return
	}
	for _, movement := range movements {
		if err := s.reservations.ReleaseByMovement(ctx, movement.ID); err != nil {
			slog.Error("sale order shipment cancel failed to release reservation", "movement_id", movement.ID, "error", err)
		}
		movement.State = inventory.MovementStateCancelled
		if _, err := s.movements.Update(ctx, movement); err != nil {
			slog.Error("sale order shipment cancel failed to update movement", "movement_id", movement.ID, "error", err)
		}
	}
	shipment, err := s.shipments.Find(ctx, shipmentID)
	if err != nil {
		slog.Error("sale order shipment cancel failed to find shipment", "shipment_id", shipmentID, "error", err)
		return
	}
	if shipment == nil {
		return
	}
	shipment.State = inventory.ShipmentStateCancelled
	if _, err := s.shipments.Update(ctx, shipment); err != nil {
		slog.Error("sale order shipment cancel failed to update shipment", "shipment_id", shipmentID, "error", err)
	}
}

func (s SaleOrderService) ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[SaleOrder], error) {
	return s.orders.List(ctx, scope.ToOrg(q, organizationID))
}

func (s SaleOrderService) FindInOrg(ctx context.Context, id, organizationID uint64) (*SaleOrder, error) {
	e, err := s.Find(ctx, id)
	if err != nil {
		return nil, dao.NotFound(err, ErrOrderNotFound)
	}
	if e == nil || !scope.Owns(e.OrganizationID, organizationID) {
		return nil, ErrOrderNotFound
	}
	return e, nil
}
