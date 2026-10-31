package handler

import (
	"errors"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/accounting"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/sales"
)

type SaleOrderHandler struct {
	svc sales.SaleOrderService
}

func NewSaleOrderHandler(svc sales.SaleOrderService) SaleOrderHandler {
	return SaleOrderHandler{svc: svc}
}

type SaleOrderResponse struct {
	ID             uint64                  `json:"id"`
	OrganizationID *uint64                 `json:"organization_id"`
	Name           *string                 `json:"name"`
	ContactID      uint64                  `json:"contact_id"`
	ShipAddressID  *uint64                 `json:"ship_address_id"`
	BillAddressID  *uint64                 `json:"bill_address_id"`
	PriceBookID    *uint64                 `json:"price_book_id"`
	CurrencyCode   *string                 `json:"currency_code"`
	SalespersonID  *uint64                 `json:"salesperson_id"`
	SalesGroupID   *uint64                 `json:"sales_group_id"`
	ProspectID     *uint64                 `json:"prospect_id"`
	QuoteID        *uint64                 `json:"quote_id"`
	WarehouseID    *uint64                 `json:"warehouse_id"`
	State          string                  `json:"state"`
	OrderDate      *time.Time              `json:"order_date"`
	ExpectedDate   *time.Time              `json:"expected_date"`
	ValidityDate   *time.Time              `json:"validity_date"`
	PaymentTermID  *uint64                 `json:"payment_term_id"`
	Incoterm       *string                 `json:"incoterm"`
	CustomerPORef  *string                 `json:"customer_po_ref"`
	AmountUntaxed  float64                 `json:"amount_untaxed"`
	AmountTax      float64                 `json:"amount_tax"`
	AmountTotal    float64                 `json:"amount_total"`
	InvoiceStatus  string                  `json:"invoice_status"`
	DeliveryStatus string                  `json:"delivery_status"`
	Note           *string                 `json:"note"`
	Lines          []SaleOrderLineResponse `json:"lines,omitempty"`
	CreatedAt      time.Time               `json:"created_at"`
	UpdatedAt      time.Time               `json:"updated_at"`
}

type SaleOrderLineResponse struct {
	ID            uint64            `json:"id"`
	OrderID       uint64            `json:"order_id"`
	Sequence      int               `json:"sequence"`
	ItemID        *uint64           `json:"item_id"`
	Description   *string           `json:"description"`
	QtyOrdered    float64           `json:"qty_ordered"`
	QtyDelivered  float64           `json:"qty_delivered"`
	QtyInvoiced   float64           `json:"qty_invoiced"`
	UnitID        *uint64           `json:"unit_id"`
	UnitPrice     float64           `json:"unit_price"`
	DiscountPct   float64           `json:"discount_pct"`
	TaxIDs        helper.Int64Array `json:"tax_ids"`
	DimensionID   *uint64           `json:"dimension_id"`
	PriceSubtotal float64           `json:"price_subtotal"`
	PriceTax      float64           `json:"price_tax"`
	PriceTotal    float64           `json:"price_total"`
}

func newSaleOrderResponse(order *sales.SaleOrder) SaleOrderResponse {
	return SaleOrderResponse{
		ID:             order.ID,
		OrganizationID: order.OrganizationID,
		Name:           order.Name,
		ContactID:      order.ContactID,
		ShipAddressID:  order.ShipAddressID,
		BillAddressID:  order.BillAddressID,
		PriceBookID:    order.PriceBookID,
		CurrencyCode:   order.CurrencyCode,
		SalespersonID:  order.SalespersonID,
		SalesGroupID:   order.SalesGroupID,
		ProspectID:     order.ProspectID,
		QuoteID:        order.QuoteID,
		WarehouseID:    order.WarehouseID,
		State:          order.State,
		OrderDate:      order.OrderDate,
		ExpectedDate:   order.ExpectedDate,
		ValidityDate:   order.ValidityDate,
		PaymentTermID:  order.PaymentTermID,
		Incoterm:       order.Incoterm,
		CustomerPORef:  order.CustomerPORef,
		AmountUntaxed:  order.AmountUntaxed,
		AmountTax:      order.AmountTax,
		AmountTotal:    order.AmountTotal,
		InvoiceStatus:  order.InvoiceStatus,
		DeliveryStatus: order.DeliveryStatus,
		Note:           order.Note,
		CreatedAt:      order.CreatedAt,
		UpdatedAt:      order.UpdatedAt,
	}
}

func newSaleOrderLineResponse(line *sales.SaleOrderLine) SaleOrderLineResponse {
	return SaleOrderLineResponse{
		ID:            line.ID,
		OrderID:       line.OrderID,
		Sequence:      line.Sequence,
		ItemID:        line.ItemID,
		Description:   line.Description,
		QtyOrdered:    line.QtyOrdered,
		QtyDelivered:  line.QtyDelivered,
		QtyInvoiced:   line.QtyInvoiced,
		UnitID:        line.UnitID,
		UnitPrice:     line.UnitPrice,
		DiscountPct:   line.DiscountPct,
		TaxIDs:        line.TaxIDs,
		DimensionID:   line.DimensionID,
		PriceSubtotal: line.PriceSubtotal,
		PriceTax:      line.PriceTax,
		PriceTotal:    line.PriceTotal,
	}
}

var saleOrderQueryAllowlist = map[string]struct{}{
	"organization_id": {},
	"name":            {},
	"contact_id":      {},
	"state":           {},
	"price_book_id":   {},
	"salesperson_id":  {},
	"sales_group_id":  {},
	"prospect_id":     {},
	"warehouse_id":    {},
	"order_date":      {},
	"expected_date":   {},
	"amount_untaxed":  {},
	"amount_tax":      {},
	"amount_total":    {},
	"invoice_status":  {},
	"delivery_status": {},
	"created_at":      {},
	"updated_at":      {},
}

type ListSaleOrdersResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ListSaleOrdersResponse `json:"data"`
}
type ListSaleOrdersResponse struct {
	Orders []SaleOrderResponse `json:"orders"`
}

// @Summary List sale orders
// @Description Lists sale orders with pagination, sorting, and filtering, scoped to the caller's organization. Supports filtering by state, contact, salesperson, warehouse, and delivery or invoice status, and returns a CSV export when requested.
// @Tags Sale Orders
// @Accept json
// @Produce json
// @Param page query integer false "Page number" default(1)
// @Param size query integer false "Items per page (max 100)" default(20)
// @Param sort query string false "Sort fields (comma separated, e.g. name:asc)"
// @Param filter query string false "Filters (repeatable, e.g. state:eq:draft)"
// @Param format query string false "Response format" Enums(json, xml, csv)
// @Success 200 {object} ListSaleOrdersResponseEnvelope "Sale orders retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 422 {object} httpx.ErrorResponse "Invalid query parameters"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/sale-orders [get]
func (h SaleOrderHandler) List(c fiber.Ctx) error {
	parsedQuery, err := httpx.ParseQueryParams(c, saleOrderQueryAllowlist)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid query parameters.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	page, err := h.svc.ListInOrg(c, parsedQuery, organizationID)
	if err != nil {
		httpx.RequestLog(c).Error("sale order list failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve sale orders.", err)
	}

	items := make([]SaleOrderResponse, len(page.Items))
	for i, order := range page.Items {
		items[i] = newSaleOrderResponse(order)
	}

	if httpx.RequestFormat(c) == httpx.FormatCSV {
		return httpx.ExportCSV(c, fiber.StatusOK, "sale-orders.csv", items)
	}

	return httpx.CreateSuccessResponseWithMeta(c, "Sale orders retrieved successfully.", ListSaleOrdersResponse{
		Orders: items,
	}, httpx.BuildListMeta(parsedQuery, page.Count))
}

type GetSaleOrderResponseEnvelope struct {
	httpx.EnvelopeBase
	Data GetSaleOrderResponse `json:"data"`
}
type GetSaleOrderResponse struct {
	Order SaleOrderResponse `json:"order"`
}

// @Summary Get sale order
// @Description Gets a single sale order by id together with its full set of lines, each with pricing, tax, delivery, and invoicing quantities. Sale orders not belonging to the caller's organization are treated as not found.
// @Tags Sale Orders
// @Accept json
// @Produce json
// @Param id path integer true "Sale order ID"
// @Success 200 {object} GetSaleOrderResponseEnvelope "Sale order retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Sale order not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/sale-orders/{id} [get]
func (h SaleOrderHandler) Get(c fiber.Ctx) error {
	orderID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid sale order id provided.", nil)
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	order, err := h.svc.FindInOrg(c, orderID, organizationID)
	if err != nil {
		if errors.Is(err, sales.ErrOrderNotFound) {
			return httpx.CreateNotFoundResponse(c, "Sale order not found.")
		}
		httpx.RequestLog(c).Error("sale order lookup failed", "order_id", orderID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to get sale order.", err)
	}

	lines, err := h.svc.ListLines(c, orderID)
	if err != nil {
		httpx.RequestLog(c).Error("sale order line list failed", "order_id", orderID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to get sale order.", err)
	}

	response := newSaleOrderResponse(order)
	response.Lines = make([]SaleOrderLineResponse, len(lines))
	for i, line := range lines {
		response.Lines[i] = newSaleOrderLineResponse(line)
	}

	return httpx.CreateSuccessResponse(c, "Sale order retrieved successfully.", GetSaleOrderResponse{
		Order: response,
	})
}

type SaleOrderLineRequest struct {
	Sequence    int               `json:"sequence"`
	ItemID      *uint64           `json:"item_id" validate:"required"`
	Description *string           `json:"description"`
	QtyOrdered  float64           `json:"qty_ordered" validate:"required,gt=0"`
	UnitID      *uint64           `json:"unit_id"`
	DiscountPct float64           `json:"discount_pct"`
	TaxIDs      helper.Int64Array `json:"tax_ids"`
	DimensionID *uint64           `json:"dimension_id"`
}

type CreateSaleOrderRequest struct {
	OrganizationID      *uint64                `json:"organization_id"`
	ContactID           uint64                 `json:"contact_id" validate:"required,gt=0"`
	ShipAddressID       *uint64                `json:"ship_address_id"`
	BillAddressID       *uint64                `json:"bill_address_id"`
	PriceBookID         *uint64                `json:"price_book_id" validate:"required"`
	SalespersonID       *uint64                `json:"salesperson_id"`
	SalesGroupID        *uint64                `json:"sales_group_id"`
	ProspectID          *uint64                `json:"prospect_id"`
	QuoteID             *uint64                `json:"quote_id"`
	WarehouseID         *uint64                `json:"warehouse_id" validate:"required"`
	OrderDate           *string                `json:"order_date"`
	ExpectedDate        *string                `json:"expected_date"`
	ValidityDate        *string                `json:"validity_date"`
	PaymentTermID       *uint64                `json:"payment_term_id"`
	Incoterm            *string                `json:"incoterm"`
	CustomerPORef       *string                `json:"customer_po_ref"`
	Note                *string                `json:"note"`
	AllowMultipleOrders bool                   `json:"allow_multiple_orders"`
	Lines               []SaleOrderLineRequest `json:"lines"`
}

type CreateSaleOrderResponseEnvelope struct {
	httpx.EnvelopeBase
	Data CreateSaleOrderResponse `json:"data"`
}
type CreateSaleOrderResponse struct {
	Order SaleOrderResponse `json:"order"`
}

// @Summary Create sale order
// @Description Creates a draft sale order with its lines, contact, price_book, and warehouse. Prices are resolved from the price_book and amounts are computed per line. When a CRM opportunity is provided it must be won; walk-in sales can omit the opportunity.
// @Tags Sale Orders
// @Accept json
// @Produce json
// @Param body body CreateSaleOrderRequest true "Sale order details"
// @Success 201 {object} CreateSaleOrderResponseEnvelope "Sale order created successfully."
// @Failure 400 {object} httpx.ErrorResponse "Bad request"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 422 {object} httpx.ErrorResponse "Validation error or unknown reference"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/sale-orders [post]
func (h SaleOrderHandler) Create(c fiber.Ctx) error {
	var request CreateSaleOrderRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}

	lines := make([]*sales.SaleOrderLine, len(request.Lines))
	for i, line := range request.Lines {
		lines[i] = &sales.SaleOrderLine{
			Sequence:    line.Sequence,
			ItemID:      line.ItemID,
			Description: line.Description,
			QtyOrdered:  line.QtyOrdered,
			UnitID:      line.UnitID,
			DiscountPct: line.DiscountPct,
			TaxIDs:      line.TaxIDs,
			DimensionID: line.DimensionID,
		}
	}

	orderDate, err := parseSaleDate(request.OrderDate)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid order date provided.", nil)
	}
	expectedDate, err := parseSaleDate(request.ExpectedDate)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid expected date provided.", nil)
	}
	validityDate, err := parseSaleDate(request.ValidityDate)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid validity date provided.", nil)
	}

	order, err := h.svc.Create(c, &sales.SaleOrder{
		OrganizationID:      httpx.TenantOrganizationID(c, request.OrganizationID),
		ContactID:           request.ContactID,
		ShipAddressID:       request.ShipAddressID,
		BillAddressID:       request.BillAddressID,
		PriceBookID:         request.PriceBookID,
		SalespersonID:       request.SalespersonID,
		SalesGroupID:        request.SalesGroupID,
		ProspectID:          request.ProspectID,
		QuoteID:             request.QuoteID,
		WarehouseID:         request.WarehouseID,
		OrderDate:           orderDate,
		ExpectedDate:        expectedDate,
		ValidityDate:        validityDate,
		PaymentTermID:       request.PaymentTermID,
		Incoterm:            request.Incoterm,
		CustomerPORef:       request.CustomerPORef,
		Note:                request.Note,
		AllowMultipleOrders: request.AllowMultipleOrders,
	}, lines)
	if err != nil {
		return writeSaleOrderError(c, err)
	}

	return httpx.CreateCreatedResponse(c, "Sale order created successfully.", CreateSaleOrderResponse{
		Order: newSaleOrderResponse(order),
	})
}

type UpdateSaleOrderRequest struct {
	OrganizationID *uint64                `json:"organization_id"`
	ContactID      uint64                 `json:"contact_id" validate:"required,gt=0"`
	ShipAddressID  *uint64                `json:"ship_address_id"`
	BillAddressID  *uint64                `json:"bill_address_id"`
	PriceBookID    *uint64                `json:"price_book_id" validate:"required"`
	SalespersonID  *uint64                `json:"salesperson_id"`
	SalesGroupID   *uint64                `json:"sales_group_id"`
	WarehouseID    *uint64                `json:"warehouse_id" validate:"required"`
	OrderDate      *string                `json:"order_date"`
	ExpectedDate   *string                `json:"expected_date"`
	ValidityDate   *string                `json:"validity_date"`
	PaymentTermID  *uint64                `json:"payment_term_id"`
	Incoterm       *string                `json:"incoterm"`
	CustomerPORef  *string                `json:"customer_po_ref"`
	Note           *string                `json:"note"`
	Lines          []SaleOrderLineRequest `json:"lines"`
}

type UpdateSaleOrderResponseEnvelope struct {
	httpx.EnvelopeBase
	Data UpdateSaleOrderResponse `json:"data"`
}
type UpdateSaleOrderResponse struct {
	Order SaleOrderResponse `json:"order"`
}

// @Summary Update draft sale order
// @Description Updates a draft sale order by replacing its lines and recomputing untaxed, tax, and total amounts from the price_book. Only orders still in draft can be updated, and the order's name, currency, and source opportunity are preserved.
// @Tags Sale Orders
// @Accept json
// @Produce json
// @Param id path integer true "Sale order ID"
// @Param body body UpdateSaleOrderRequest true "Sale order details"
// @Success 200 {object} UpdateSaleOrderResponseEnvelope "Sale order updated successfully."
// @Failure 400 {object} httpx.ErrorResponse "Bad request"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Sale order not found"
// @Failure 409 {object} httpx.ErrorResponse "Sale order is not in draft state"
// @Failure 422 {object} httpx.ErrorResponse "Validation error or unknown reference"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/sale-orders/{id} [put]
func (h SaleOrderHandler) Update(c fiber.Ctx) error {
	orderID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid sale order id provided.", nil)
	}

	var request UpdateSaleOrderRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	existing, err := h.svc.FindInOrg(c, orderID, organizationID)
	if err != nil {
		if errors.Is(err, sales.ErrOrderNotFound) {
			return httpx.CreateNotFoundResponse(c, "Sale order not found.")
		}
		httpx.RequestLog(c).Error("sale order lookup failed", "order_id", orderID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to update sale order.", err)
	}

	lines := make([]*sales.SaleOrderLine, len(request.Lines))
	for i, line := range request.Lines {
		lines[i] = &sales.SaleOrderLine{
			Sequence:    line.Sequence,
			ItemID:      line.ItemID,
			Description: line.Description,
			QtyOrdered:  line.QtyOrdered,
			UnitID:      line.UnitID,
			DiscountPct: line.DiscountPct,
			TaxIDs:      line.TaxIDs,
			DimensionID: line.DimensionID,
		}
	}

	orderDate, err := parseSaleDate(request.OrderDate)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid order date provided.", nil)
	}
	expectedDate, err := parseSaleDate(request.ExpectedDate)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid expected date provided.", nil)
	}
	validityDate, err := parseSaleDate(request.ValidityDate)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid validity date provided.", nil)
	}

	updated, err := h.svc.UpdateDraft(c, orderID, &sales.SaleOrder{
		OrganizationID: httpx.TenantOrganizationID(c, existing.OrganizationID),
		ContactID:      request.ContactID,
		ShipAddressID:  request.ShipAddressID,
		BillAddressID:  request.BillAddressID,
		PriceBookID:    request.PriceBookID,
		SalespersonID:  request.SalespersonID,
		SalesGroupID:   request.SalesGroupID,
		WarehouseID:    request.WarehouseID,
		OrderDate:      orderDate,
		ExpectedDate:   expectedDate,
		ValidityDate:   validityDate,
		PaymentTermID:  request.PaymentTermID,
		Incoterm:       request.Incoterm,
		CustomerPORef:  request.CustomerPORef,
		Note:           request.Note,
	}, lines)
	if err != nil {
		return writeSaleOrderError(c, err)
	}

	return httpx.CreateSuccessResponse(c, "Sale order updated successfully.", UpdateSaleOrderResponse{
		Order: newSaleOrderResponse(updated),
	})
}

// @Summary Delete sale order
// @Description Permanently deletes a sale order by id. Only sale orders belonging to the caller's organization can be deleted, and unknown orders return not found.
// @Tags Sale Orders
// @Accept json
// @Produce json
// @Param id path integer true "Sale order ID"
// @Success 204 "No Content"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Sale order not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/sale-orders/{id} [delete]
func (h SaleOrderHandler) Delete(c fiber.Ctx) error {
	orderID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid sale order id provided.", nil)
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	_, err = h.svc.FindInOrg(c, orderID, organizationID)
	if err != nil {
		if errors.Is(err, sales.ErrOrderNotFound) {
			return httpx.CreateNotFoundResponse(c, "Sale order not found.")
		}
		httpx.RequestLog(c).Error("sale order lookup failed", "order_id", orderID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to delete sale order.", err)
	}

	if err := h.svc.Delete(c, orderID); err != nil {
		httpx.RequestLog(c).Error("sale order deletion failed", "order_id", orderID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to delete sale order.", err)
	}

	return httpx.CreateNoContentResponse(c)
}

func parseSaleDate(value *string) (*time.Time, error) {
	return helper.ParseDate(value)
}

func writeSaleOrderError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "sale order write failed", "Failed to process sale order.",
		httpx.NotFound(sales.ErrOrderNotFound, "Sale order not found."),
		httpx.Unprocessable(sales.ErrOrderSequenceNotFound, "Sale order document sequence is not configured."),
		httpx.Conflict(sales.ErrOrderState, "Sale order cannot be processed in its current state."),
		httpx.Conflict(sales.ErrSalesCreditLimit, "Sale exceeds the customer credit limit and needs an approved sales approval request."),
		httpx.Conflict(sales.ErrSalesApprovalRequired, "Sale requires approval but no sales approvers are configured."),
		httpx.Conflict(sales.ErrSalesApprovalPending, "Sale is waiting for approval. Retry after the request is approved."),
		httpx.Conflict(sales.ErrSalesApprovalRefused, "Sale approval request was refused. Resolve the approval and retry."),
		httpx.Unprocessable(sales.ErrOrderNoLines, "Sale order must have at least one line."),
		httpx.Unprocessable(sales.ErrOrderQty, "Sale order line quantity must be positive."),
		httpx.Unprocessable(sales.ErrOrderDiscount, "Sale order line discount must be between 0 and 100."),
		httpx.Unprocessable(sales.ErrOrderContact, "Sale order contact does not exist."),
		httpx.Unprocessable(sales.ErrOrderPriceBook, "Sale order price_book does not exist."),
		httpx.Unprocessable(sales.ErrOrderWarehouse, "Sale order warehouse does not exist."),
		httpx.Unprocessable(sales.ErrOrderContactOrganization, "Sale order contact does not belong to this organization."),
		httpx.Unprocessable(sales.ErrOrderPriceBookOrganization, "Sale order price_book does not belong to this organization."),
		httpx.Unprocessable(sales.ErrOrderWarehouseOrganization, "Sale order warehouse does not belong to this organization."),
		httpx.Unprocessable(sales.ErrOrderVariant, "Sale order item variant does not exist."),
		httpx.Unprocessable(sales.ErrOrderVariantOrganization, "Sale order line item does not belong to this organization."),
		httpx.Unprocessable(sales.ErrOrderLead, "Sale order source opportunity does not exist."),
		httpx.Unprocessable(sales.ErrOrderLeadOrganization, "Sale order source opportunity does not belong to this organization."),
		httpx.Conflict(sales.ErrOrderLeadNotWon, "Sale order source opportunity must be won."),
		httpx.Conflict(sales.ErrOrderLeadLost, "Sale order source opportunity is lost."),
		httpx.Conflict(sales.ErrOrderLeadAlreadyConverted, "Sale order source opportunity already has an active order. Set allow_multiple_orders to override."),
		httpx.Unprocessable(sales.ErrOrderTax, "Sale order tax does not exist."),
		httpx.Unprocessable(sales.ErrOrderTaxInvalid, "Sale order tax is not a sale tax."),
		httpx.Unprocessable(sales.ErrOrderTaxOrganization, "Sale order tax does not belong to this organization."),
		httpx.Unprocessable(sales.ErrOrderCurrency, "Sale order currency does not exist."),
		httpx.Unprocessable(sales.ErrOrderLocation, "Sale order warehouse stock location not found."),
		httpx.Unprocessable(sales.ErrOrderCustomerLocation, "No customer stock location configured."),
		httpx.Conflict(sales.ErrOrderStockUnavailable, "Sale order line quantity is not available to reserve."),
		httpx.Conflict(sales.ErrBalanceNotFound, "No stock quant found to reserve."),
		httpx.Conflict(sales.ErrHoldOverflow, "Insufficient stock to reserve this sale order."),
		httpx.Conflict(sales.ErrOrderShipmentNotFound, "No outgoing shipment found for this sale order."),
		httpx.Conflict(sales.ErrOrderNothingToDeliver, "Sale order has nothing ready to deliver."),
		httpx.Conflict(sales.ErrOrderNoInvoices, "No open invoices found for this sale order. Set on_account to pay other open invoices for the customer."),
		httpx.Conflict(sales.ErrOrderNothingToInvoice, "Sale order has no quantity available to invoice."),
		httpx.Unprocessable(sales.ErrOrderAdvancePercentage, "Advance percentage must be between 0 and 100."),
		httpx.Unprocessable(sales.ErrOrderInvoiceMismatch, "Invoice does not belong to this sale order."),
		httpx.NotFound(accounting.ErrInvoiceNotFound, "Invoice not found."),
		httpx.Conflict(accounting.ErrInvoiceNotPosted, "Invoice must be posted before it can be settled."),
		httpx.Unprocessable(accounting.ErrCreditMismatch, "Deposit invoice does not match the final invoice."),
		httpx.Unprocessable(accounting.ErrNoReceivableAccount, "No receivable account configured for the organization."),
		httpx.Unprocessable(accounting.ErrNoRevenueAccount, "No revenue account configured for the item."),
		httpx.Unprocessable(accounting.ErrInvoiceNoLines, "Invoice must have at least one line."),
		httpx.Unprocessable(accounting.ErrInvoiceTaxInvalid, "Invoice line references an invalid sale tax."),
		httpx.Unprocessable(accounting.ErrInvoiceSequence, "Invoice document sequence is not configured."),
		httpx.Unprocessable(sales.ErrNoIncomeAccount, "Item category has no income account configured."),
		httpx.Unprocessable(accounting.ErrPaymentAmount, "Payment amount must be positive."),
		httpx.Unprocessable(accounting.ErrPaymentNoInvoices, "Payment must allocate at least one invoice."),
		httpx.Conflict(accounting.ErrOverAllocation, "Payment exceeds the total open invoice balance."),
		httpx.Unprocessable(accounting.ErrNoBankAccount, "No bank or cash account configured for the journal."),
	)
}
