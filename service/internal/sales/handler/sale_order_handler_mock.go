//go:build test

package handler

import (
	"context"

	"github.com/jalusw/swantara/apps/service/internal/contacts"
	"github.com/jalusw/swantara/apps/service/internal/crm"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/inventory"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/kernel/sequence"
	"github.com/jalusw/swantara/apps/service/internal/products"
	"github.com/jalusw/swantara/apps/service/internal/reference"
	"github.com/jalusw/swantara/apps/service/internal/sales"
)

type saleOrderHandlerDeps struct {
	orders       sales.SaleOrderDAOMock
	lines        sales.SaleOrderLineDAOMock
	taxes        dao.CRUDMock[reference.Tax]
	productSvc   products.ProductService
	contacts     contacts.ContactDAOMock
	shipments    inventory.ShipmentDAOMock
	movements    inventory.StockMovementDAOMock
	ship         sales.ShipEngineMock
	invoices     sales.InvoiceEngineMock
	openInvoices sales.InvoiceLookupMock
	payments     sales.PaymentEngineMock
}

func newSaleOrderHandlerTestSvc(deps saleOrderHandlerDeps) sales.SaleOrderService {
	return sales.NewSaleOrderService(
		sales.SaleOrderRepositories{
			Orders: deps.orders,
			Lines:  deps.lines,
			PriceBooks: products.PriceBookDAOMock{
				CRUDMock: dao.CRUDMock[products.PriceBook]{
					FindFunc: func(_ context.Context, _ uint64) (*products.PriceBook, error) {
						return &products.PriceBook{Base: model.Base{ID: 2}, Name: "Retail", CurrencyCode: helper.Ptr("IDR")}, nil
					},
				},
			},
			Taxes:    deps.taxes,
			Contacts: deps.contacts,
			Leads: crm.ProspectDAOMock{
				CRUDMock: dao.CRUDMock[crm.Prospect]{
					FindFunc: func(_ context.Context, _ uint64) (*crm.Prospect, error) {
						return &crm.Prospect{Base: model.Base{ID: 3}, Type: crm.ProspectKindOpportunity, StageID: helper.Ptr(uint64(8))}, nil
					},
				},
			},
			Stages: dao.CRUDMock[reference.PipelineStage]{
				FindFunc: func(_ context.Context, _ uint64) (*reference.PipelineStage, error) {
					return &reference.PipelineStage{Base: model.Base{ID: 8}, IsWon: true}, nil
				},
			},
			Warehouses: inventory.WarehouseDAOMock{
				CRUDMock: dao.CRUDMock[reference.Warehouse]{
					FindFunc: func(_ context.Context, _ uint64) (*reference.Warehouse, error) {
						return &reference.Warehouse{Base: model.Base{ID: 4}, Name: "Main Warehouse", OrganizationID: helper.Ptr(uint64(10))}, nil
					},
				},
			},
			Locations: inventory.StockLocationDAOMock{
				CRUDMock: dao.CRUDMock[reference.StockLocation]{
					ListFunc: func(_ context.Context, q *query.Query) (*query.Page[reference.StockLocation], error) {
						if len(q.Filters) > 0 && q.Filters[0].Field == "usage" {
							return &query.Page[reference.StockLocation]{Items: []*reference.StockLocation{{Base: model.Base{ID: 90}, OrganizationID: helper.Ptr(uint64(10)), Usage: "customer"}}}, nil
						}
						return &query.Page[reference.StockLocation]{Items: []*reference.StockLocation{{Base: model.Base{ID: 10}, OrganizationID: helper.Ptr(uint64(10)), Usage: "internal"}}}, nil
					},
				},
			},
			Quants:       inventory.StockBalanceDAOMock{},
			Shipments:    deps.shipments,
			Movements:    deps.movements,
			Reservations: inventory.StockHoldDAOMock{},
		},
		sales.SaleOrderEngines{
			Sequences:      sequence.NewService(sales.SequenceDAOMock{}),
			Product:        deps.productSvc,
			ReservationSvc: inventory.NewHoldService(inventory.StockHoldDAOMock{}, inventory.StockBalanceDAOMock{}),
			Ship:           deps.ship,
			Invoices:       deps.invoices,
			OpenInvoices:   deps.openInvoices,
			Payments:       deps.payments,
		},
	)
}
