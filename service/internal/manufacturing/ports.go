package manufacturing

import (
	"context"

	"github.com/jalusw/swantara/apps/service/internal/inventory"
	"github.com/jalusw/swantara/apps/service/internal/procurement"
)

type PurchaseOrderCreator interface {
	Create(ctx context.Context, order *procurement.PurchaseOrder, lines []*procurement.PurchaseOrderLine) (*procurement.PurchaseOrder, error)
}

type PurchasePlanner interface {
	Create(ctx context.Context, order *procurement.PurchaseOrder, lines []*procurement.PurchaseOrderLine) (*procurement.PurchaseOrder, error)
}

type ManufacturePlanner interface {
	Create(ctx context.Context, productionOrder *ProductionOrder) (*ProductionOrder, error)
	Confirm(ctx context.Context, productionOrderID uint64) (*ProductionOrder, error)
}

type TransferPlanner interface {
	Create(ctx context.Context, transfer *inventory.WarehouseTransfer, lines []inventory.TransferLine) (*inventory.WarehouseTransfer, error)
}
