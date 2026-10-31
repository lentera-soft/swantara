package interorganization

import (
	"context"

	"github.com/jalusw/swantara/apps/service/internal/accounting"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/procurement"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type SupplierBillCreator interface {
	CreateSupplierBill(ctx context.Context, request accounting.CreateSupplierBillRequest) (*accounting.Invoice, error)
}

type OrganizationLookup interface {
	Find(ctx context.Context, id uint64) (*reference.Organization, error)
	List(ctx context.Context, q *query.Query) (*query.Page[reference.Organization], error)
}

type AccountLookup interface {
	List(ctx context.Context, q *query.Query) (*query.Page[reference.Account], error)
}

type PurchaseOrderCreator interface {
	Create(ctx context.Context, order *procurement.PurchaseOrder, lines []*procurement.PurchaseOrderLine) (*procurement.PurchaseOrder, error)
}
