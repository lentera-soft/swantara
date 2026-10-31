package inventory

import (
	"context"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/accounting"
	"gorm.io/gorm"
)

type SupplierBillLineLookup interface {
	Find(ctx context.Context, id uint64) (*accounting.InvoiceLine, error)
}

type InboundCostConfigSource interface {
	JournalID(ctx context.Context, organizationID uint64) (uint64, error)
}

type ItemResolver interface {
	Resolve(ctx context.Context, variantID uint64) (ResolvedItem, error)
}

type Scrapper interface {
	Scrap(ctx context.Context, movementID uint64, journalID, expenseAccountID uint64, date time.Time) (*CostLayer, error)
}

type Poster interface {
	Post(ctx context.Context, request accounting.PostRequest) (*accounting.JournalEntry, error)
	PostTx(ctx context.Context, tx *gorm.DB, request accounting.PostRequest) (*accounting.JournalEntry, error)
}

type MovementLocker interface {
	FindForUpdateTx(ctx context.Context, tx *gorm.DB, movementID uint64) (*StockMovement, error)
}
