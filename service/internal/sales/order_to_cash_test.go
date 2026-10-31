package sales

import (
	"context"
	"testing"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/accounting"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/inventory"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/products"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

func TestSaleOrderService_Deliver(t *testing.T) {
	baseOrder := func() *SaleOrder {
		return &SaleOrder{Base: model.Base{ID: 1}, OrganizationID: helper.Ptr(uint64(1)), Name: helper.Ptr("SO/00001"), State: OrderStateConfirmed}
	}
	tests := []struct {
		name      string
		orders    SaleOrderDAOMock
		lines     SaleOrderLineDAOMock
		shipments inventory.ShipmentDAOMock
		movements inventory.StockMovementDAOMock
		ship      ShipEngineMock
		res       inventory.StockHoldDAOMock
		wantErr   error
		wantState string
	}{
		{
			name:   "ships movements and increments delivered qty",
			orders: SaleOrderDAOMock{CRUDMock: dao.CRUDMock[SaleOrder]{FindFunc: func(_ context.Context, _ uint64) (*SaleOrder, error) { return baseOrder(), nil }}},
			lines: SaleOrderLineDAOMock{
				ListByOrderFunc: func(_ context.Context, _ uint64) ([]*SaleOrderLine, error) {
					return []*SaleOrderLine{{Base: model.Base{ID: 7}, ItemID: helper.Ptr(uint64(100)), QtyOrdered: 5, QtyDelivered: 0}}, nil
				},
				CRUDMock: dao.CRUDMock[SaleOrderLine]{
					UpdateFunc: func(_ context.Context, line *SaleOrderLine) (*SaleOrderLine, error) { return line, nil },
				},
			},
			shipments: inventory.ShipmentDAOMock{
				CRUDMock: dao.CRUDMock[inventory.Shipment]{
					ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[inventory.Shipment], error) {
						return &query.Page[inventory.Shipment]{Items: []*inventory.Shipment{{Base: model.Base{ID: 1}, State: inventory.ShipmentStateAssigned}}}, nil
					},
				},
			},
			movements: inventory.StockMovementDAOMock{
				ListByShipmentFunc: func(_ context.Context, _ uint64) ([]*inventory.StockMovement, error) {
					return []*inventory.StockMovement{{Base: model.Base{ID: 21}, ItemID: 100, Qty: 3, State: inventory.MovementStateAssigned}}, nil
				},
			},
			ship: ShipEngineMock{
				ShipFunc: func(_ context.Context, moveID uint64, _ uint64, _ time.Time) (*inventory.CostLayer, error) {
					return &inventory.CostLayer{MovementID: &moveID}, nil
				},
			},
			res: inventory.StockHoldDAOMock{
				ReleaseByMovementFunc: func(_ context.Context, _ uint64) error { return nil },
			},
			wantState: DeliveryStatusPartial,
		},
		{
			name:   "rejects when nothing to ship",
			orders: SaleOrderDAOMock{CRUDMock: dao.CRUDMock[SaleOrder]{FindFunc: func(_ context.Context, _ uint64) (*SaleOrder, error) { return baseOrder(), nil }}},
			lines: SaleOrderLineDAOMock{
				ListByOrderFunc: func(_ context.Context, _ uint64) ([]*SaleOrderLine, error) {
					return []*SaleOrderLine{{Base: model.Base{ID: 7}, ItemID: helper.Ptr(uint64(100)), QtyOrdered: 5}}, nil
				},
			},
			shipments: inventory.ShipmentDAOMock{
				CRUDMock: dao.CRUDMock[inventory.Shipment]{
					ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[inventory.Shipment], error) {
						return &query.Page[inventory.Shipment]{Items: []*inventory.Shipment{{Base: model.Base{ID: 1}, State: inventory.ShipmentStateConfirmed}}}, nil
					},
				},
			},
			movements: inventory.StockMovementDAOMock{
				ListByShipmentFunc: func(_ context.Context, _ uint64) ([]*inventory.StockMovement, error) {
					return []*inventory.StockMovement{{Base: model.Base{ID: 21}, ItemID: 100, Qty: 3, State: inventory.MovementStateAssigned}}, nil
				},
			},
			wantErr: ErrOrderNothingToDeliver,
		},
		{
			name:   "rejects without shipment",
			orders: SaleOrderDAOMock{CRUDMock: dao.CRUDMock[SaleOrder]{FindFunc: func(_ context.Context, _ uint64) (*SaleOrder, error) { return baseOrder(), nil }}},
			lines: SaleOrderLineDAOMock{
				ListByOrderFunc: func(_ context.Context, _ uint64) ([]*SaleOrderLine, error) {
					return []*SaleOrderLine{{Base: model.Base{ID: 7}, ItemID: helper.Ptr(uint64(100)), QtyOrdered: 5}}, nil
				},
			},
			shipments: inventory.ShipmentDAOMock{
				CRUDMock: dao.CRUDMock[inventory.Shipment]{
					ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[inventory.Shipment], error) {
						return &query.Page[inventory.Shipment]{Items: []*inventory.Shipment{}}, nil
					},
				},
			},
			wantErr: ErrOrderShipmentNotFound,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			svc := testSaleOrderService(tt.orders, tt.lines, dao.CRUDMock[reference.Tax]{}, testPriceService(100))
			svc.shipments = tt.shipments
			svc.movements = tt.movements
			svc.ship = tt.ship
			svc.reservations = tt.res

			updated, err := svc.Deliver(ctx, 1, 20, time.Date(2026, 8, 3, 0, 0, 0, 0, time.UTC))
			if helper.AssertError(t, err, tt.wantErr != nil, tt.wantErr) {
				return
			}
			if tt.wantState != "" && updated.DeliveryStatus != tt.wantState {
				t.Errorf("delivery_status = %s, want %s", updated.DeliveryStatus, tt.wantState)
			}
		})
	}
}

func TestSaleOrderService_CreateInvoice(t *testing.T) {
	tests := []struct {
		name       string
		productSvc products.ProductService
		wantErr    error
		wantQty    float64
		wantAcct   uint64
	}{
		{
			name:       "builds lines and increments invoiced qty",
			productSvc: testIncomeProductService(4100),
			wantQty:    3,
			wantAcct:   4100,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			order := &SaleOrder{Base: model.Base{ID: 1}, OrganizationID: helper.Ptr(uint64(1)), Name: helper.Ptr("SO/00001"), ContactID: 5}
			orders := SaleOrderDAOMock{CRUDMock: dao.CRUDMock[SaleOrder]{
				FindFunc: func(_ context.Context, _ uint64) (*SaleOrder, error) { return order, nil },
			}}
			line := &SaleOrderLine{Base: model.Base{ID: 7}, ItemID: helper.Ptr(uint64(100)), Description: helper.Ptr("Widget"), QtyOrdered: 5, QtyDelivered: 3, QtyInvoiced: 0, UnitPrice: 100, TaxIDs: helper.Int64Array{9}}
			lines := SaleOrderLineDAOMock{
				ListByOrderFunc: func(_ context.Context, _ uint64) ([]*SaleOrderLine, error) {
					return []*SaleOrderLine{line}, nil
				},
			}
			var createdRequest accounting.CreateInvoiceRequest
			invoices := InvoiceEngineMock{
				CreateFunc: func(_ context.Context, request accounting.CreateInvoiceRequest) (*accounting.Invoice, error) {
					createdRequest = request
					return &accounting.Invoice{Base: model.Base{ID: 30}, ContactID: request.ContactID}, nil
				},
			}
			svc := testSaleOrderService(orders, lines, dao.CRUDMock[reference.Tax]{}, tt.productSvc)
			svc.invoices = invoices

			invoice, err := svc.CreateInvoice(ctx, 1, 20, time.Date(2026, 8, 4, 0, 0, 0, 0, time.UTC))
			if helper.AssertError(t, err, tt.wantErr != nil, tt.wantErr) {
				return
			}
			if invoice.ContactID != 5 {
				t.Errorf("invoice contact = %d, want 5", invoice.ContactID)
			}
			if len(createdRequest.Lines) != 1 {
				t.Fatalf("invoice lines = %d, want 1", len(createdRequest.Lines))
			}
			if createdRequest.Lines[0].Qty != tt.wantQty || createdRequest.Lines[0].AccountID != tt.wantAcct {
				t.Errorf("line = qty %v account %d, want %v/%v", createdRequest.Lines[0].Qty, createdRequest.Lines[0].AccountID, tt.wantQty, tt.wantAcct)
			}
			if line.QtyInvoiced != tt.wantQty {
				t.Errorf("qty_invoiced = %v, want %v", line.QtyInvoiced, tt.wantQty)
			}
		})
	}
}

func TestSaleOrderService_CollectPayment(t *testing.T) {
	tests := []struct {
		name          string
		openInvoices  InvoiceLookupMock
		onAccount     bool
		wantErr       error
		wantInvoiceID []uint64
	}{
		{
			name: "allocates only the sale order invoices",
			openInvoices: InvoiceLookupMock{
				ListOpenBySaleOrderFunc: func(_ context.Context, _ uint64) ([]*accounting.Invoice, error) {
					return []*accounting.Invoice{
						{Base: model.Base{ID: 11}, ContactID: 5},
						{Base: model.Base{ID: 12}, ContactID: 5},
					}, nil
				},
				ListOpenByContactFunc: func(_ context.Context, _ uint64) ([]*accounting.Invoice, error) {
					return []*accounting.Invoice{
						{Base: model.Base{ID: 11}, ContactID: 5},
						{Base: model.Base{ID: 99}, ContactID: 5},
					}, nil
				},
			},
			wantInvoiceID: []uint64{11, 12},
		},
		{
			name: "falls back to on-account invoices",
			openInvoices: InvoiceLookupMock{
				ListOpenBySaleOrderFunc: func(_ context.Context, _ uint64) ([]*accounting.Invoice, error) {
					return nil, nil
				},
				ListOpenByContactFunc: func(_ context.Context, _ uint64) ([]*accounting.Invoice, error) {
					return []*accounting.Invoice{
						{Base: model.Base{ID: 21}, ContactID: 5},
						{Base: model.Base{ID: 22}, ContactID: 5},
					}, nil
				},
			},
			onAccount:     true,
			wantInvoiceID: []uint64{21, 22},
		},
		{
			name: "rejects without open order invoices",
			openInvoices: InvoiceLookupMock{
				ListOpenBySaleOrderFunc: func(_ context.Context, _ uint64) ([]*accounting.Invoice, error) {
					return []*accounting.Invoice{}, nil
				},
				ListOpenByContactFunc: func(_ context.Context, _ uint64) ([]*accounting.Invoice, error) {
					return []*accounting.Invoice{{Base: model.Base{ID: 99}, ContactID: 5}}, nil
				},
			},
			wantErr: ErrOrderNoInvoices,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			order := &SaleOrder{Base: model.Base{ID: 1}, OrganizationID: helper.Ptr(uint64(1)), Name: helper.Ptr("SO/00001"), ContactID: 5}
			orders := SaleOrderDAOMock{CRUDMock: dao.CRUDMock[SaleOrder]{
				FindFunc: func(_ context.Context, _ uint64) (*SaleOrder, error) { return order, nil },
			}}
			var createdRequest accounting.CreatePaymentRequest
			payments := PaymentEngineMock{
				CreateFunc: func(_ context.Context, request accounting.CreatePaymentRequest) (*accounting.Payment, error) {
					createdRequest = request
					return &accounting.Payment{Base: model.Base{ID: 40}, ContactID: request.ContactID, Amount: request.Amount}, nil
				},
			}
			svc := testSaleOrderService(orders, SaleOrderLineDAOMock{}, dao.CRUDMock[reference.Tax]{}, testPriceService(100))
			svc.openInvoices = tt.openInvoices
			svc.payments = payments

			payment, err := svc.CollectPayment(ctx, 1, 20, 200, time.Date(2026, 8, 5, 0, 0, 0, 0, time.UTC), tt.onAccount)
			if helper.AssertError(t, err, tt.wantErr != nil, tt.wantErr) {
				return
			}
			if payment.ContactID != 5 || payment.Amount != 200 {
				t.Errorf("payment = contact %d amount %v, want 5/200", payment.ContactID, payment.Amount)
			}
			if len(createdRequest.InvoiceIDs) != len(tt.wantInvoiceID) {
				t.Fatalf("invoice ids = %v, want %v", createdRequest.InvoiceIDs, tt.wantInvoiceID)
			}
			for i, want := range tt.wantInvoiceID {
				if createdRequest.InvoiceIDs[i] != want {
					t.Errorf("invoice ids = %v, want %v", createdRequest.InvoiceIDs, tt.wantInvoiceID)
					break
				}
			}
		})
	}
}

func testIncomeProductService(incomeAccountID uint64) products.ProductService {
	return products.NewProductService(
		products.ItemDAOMock{
			CRUDMock: dao.CRUDMock[products.Item]{
				FindFunc: func(_ context.Context, _ uint64) (*products.Item, error) {
					return &products.Item{Base: model.Base{ID: 1}, ListPrice: 100, CategoryID: helper.Ptr(uint64(1))}, nil
				},
			},
		},
		products.ItemVariantDAOMock{
			CRUDMock: dao.CRUDMock[products.ItemVariant]{
				FindFunc: func(_ context.Context, _ uint64) (*products.ItemVariant, error) {
					return &products.ItemVariant{Base: model.Base{ID: 100}, ItemID: 1}, nil
				},
			},
		},
		dao.CRUDMock[reference.ItemCategory]{
			FindFunc: func(_ context.Context, _ uint64) (*reference.ItemCategory, error) {
				return &reference.ItemCategory{Base: model.Base{ID: 1}, IncomeAccountID: helper.Ptr(incomeAccountID)}, nil
			},
		},
		products.PriceBookDAOMock{},
		products.PriceRuleDAOMock{},
	)
}

func TestSaleOrderService_CreateAdvanceInvoice(t *testing.T) {
	tests := []struct {
		name       string
		state      string
		percentage float64
		line       *SaleOrderLine
		wantErr    error
		wantQty    float64
	}{
		{
			name:       "invoices requested percentage of ordered quantity",
			state:      OrderStateConfirmed,
			percentage: 50,
			line:       &SaleOrderLine{Base: model.Base{ID: 7}, ItemID: helper.Ptr(uint64(100)), QtyOrdered: 10, QtyInvoiced: 2, UnitPrice: 100},
			wantQty:    3,
		},
		{
			name:       "caps at remaining ordered quantity",
			state:      OrderStateDone,
			percentage: 100,
			line:       &SaleOrderLine{Base: model.Base{ID: 7}, ItemID: helper.Ptr(uint64(100)), QtyOrdered: 10, QtyInvoiced: 9, UnitPrice: 100},
			wantQty:    1,
		},
		{
			name:       "rejects invalid percentage",
			state:      OrderStateConfirmed,
			percentage: 0,
			line:       &SaleOrderLine{Base: model.Base{ID: 7}, ItemID: helper.Ptr(uint64(100)), QtyOrdered: 10, UnitPrice: 100},
			wantErr:    ErrOrderAdvancePercentage,
		},
		{
			name:       "rejects draft order",
			state:      OrderStateDraft,
			percentage: 50,
			line:       &SaleOrderLine{Base: model.Base{ID: 7}, ItemID: helper.Ptr(uint64(100)), QtyOrdered: 10, UnitPrice: 100},
			wantErr:    ErrOrderState,
		},
		{
			name:       "rejects fully invoiced line",
			state:      OrderStateConfirmed,
			percentage: 50,
			line:       &SaleOrderLine{Base: model.Base{ID: 7}, ItemID: helper.Ptr(uint64(100)), QtyOrdered: 10, QtyInvoiced: 10, UnitPrice: 100},
			wantErr:    ErrOrderNothingToInvoice,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			order := &SaleOrder{Base: model.Base{ID: 1}, OrganizationID: helper.Ptr(uint64(1)), Name: helper.Ptr("SO/00001"), ContactID: 5, State: tt.state}
			orders := SaleOrderDAOMock{CRUDMock: dao.CRUDMock[SaleOrder]{
				FindFunc: func(_ context.Context, _ uint64) (*SaleOrder, error) { return order, nil },
			}}
			lines := SaleOrderLineDAOMock{
				ListByOrderFunc: func(_ context.Context, _ uint64) ([]*SaleOrderLine, error) {
					return []*SaleOrderLine{tt.line}, nil
				},
			}
			var createdRequest accounting.CreateInvoiceRequest
			invoices := InvoiceEngineMock{
				CreateFunc: func(_ context.Context, request accounting.CreateInvoiceRequest) (*accounting.Invoice, error) {
					createdRequest = request
					return &accounting.Invoice{Base: model.Base{ID: 30}, ContactID: request.ContactID, Reference: helper.Ptr(request.Reference)}, nil
				},
			}
			svc := testSaleOrderService(orders, lines, dao.CRUDMock[reference.Tax]{}, testIncomeProductService(4100))
			svc.invoices = invoices
			initialInvoiced := tt.line.QtyInvoiced

			_, err := svc.CreateAdvanceInvoice(ctx, 1, 20, time.Date(2026, 8, 4, 0, 0, 0, 0, time.UTC), tt.percentage)
			if helper.AssertError(t, err, tt.wantErr != nil, tt.wantErr) {
				return
			}
			if len(createdRequest.Lines) != 1 {
				t.Fatalf("invoice lines = %d, want 1", len(createdRequest.Lines))
			}
			if createdRequest.Lines[0].Qty != tt.wantQty {
				t.Errorf("invoice qty = %v, want %v", createdRequest.Lines[0].Qty, tt.wantQty)
			}
			if createdRequest.Reference != "SO/00001" {
				t.Errorf("reference = %q, want order reference", createdRequest.Reference)
			}
			if tt.line.QtyInvoiced != initialInvoiced+tt.wantQty {
				t.Errorf("qty_invoiced = %v, want %v", tt.line.QtyInvoiced, initialInvoiced+tt.wantQty)
			}
		})
	}
}

func TestSaleOrderService_DeductDeposit(t *testing.T) {
	tests := []struct {
		name    string
		advance *accounting.Invoice
		final   *accounting.Invoice
		wantErr error
	}{
		{
			name:    "deducts deposit for order invoices",
			advance: &accounting.Invoice{Base: model.Base{ID: 31}, OrganizationID: helper.Ptr(uint64(1)), Reference: helper.Ptr("SO/00001")},
			final:   &accounting.Invoice{Base: model.Base{ID: 32}, OrganizationID: helper.Ptr(uint64(1)), Reference: helper.Ptr("SO/00001")},
		},
		{
			name:    "rejects invoice from another order",
			advance: &accounting.Invoice{Base: model.Base{ID: 31}, OrganizationID: helper.Ptr(uint64(1)), Reference: helper.Ptr("SO/00002")},
			final:   &accounting.Invoice{Base: model.Base{ID: 32}, OrganizationID: helper.Ptr(uint64(1)), Reference: helper.Ptr("SO/00001")},
			wantErr: ErrOrderInvoiceMismatch,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			order := &SaleOrder{Base: model.Base{ID: 1}, OrganizationID: helper.Ptr(uint64(1)), Name: helper.Ptr("SO/00001")}
			orders := SaleOrderDAOMock{CRUDMock: dao.CRUDMock[SaleOrder]{
				FindFunc: func(_ context.Context, _ uint64) (*SaleOrder, error) { return order, nil },
			}}
			openInvoices := InvoiceLookupMock{
				FindFunc: func(_ context.Context, id uint64) (*accounting.Invoice, error) {
					if id == tt.advance.ID {
						return tt.advance, nil
					}
					return tt.final, nil
				},
			}
			var createdRequest accounting.DeductDownPaymentRequest
			invoices := InvoiceEngineMock{
				DeductDownPaymentFunc: func(_ context.Context, request accounting.DeductDownPaymentRequest) (*accounting.DownPaymentLink, error) {
					createdRequest = request
					return &accounting.DownPaymentLink{AdvanceInvoiceID: request.AdvanceInvoiceID, FinalInvoiceID: request.FinalInvoiceID}, nil
				},
			}
			svc := testSaleOrderService(orders, SaleOrderLineDAOMock{}, dao.CRUDMock[reference.Tax]{}, testPriceService(100))
			svc.openInvoices = openInvoices
			svc.invoices = invoices

			_, err := svc.DeductDeposit(ctx, 1, 31, 32, 25)
			if helper.AssertError(t, err, tt.wantErr != nil, tt.wantErr) {
				return
			}
			if createdRequest.FinalInvoiceID != 32 || createdRequest.AdvanceInvoiceID != 31 || createdRequest.Amount != 25 {
				t.Errorf("request = %+v, want advance 31 final 32 amount 25", createdRequest)
			}
		})
	}
}
