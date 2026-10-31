package sales

import (
	"context"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/accounting"
	"github.com/jalusw/swantara/apps/service/internal/inventory"
)

type ShipEngine interface {
	Ship(ctx context.Context, moveID uint64, journalID uint64, date time.Time) (*inventory.CostLayer, error)
}

type InvoiceEngine interface {
	Create(ctx context.Context, request accounting.CreateInvoiceRequest) (*accounting.Invoice, error)
	DeductDownPayment(ctx context.Context, request accounting.DeductDownPaymentRequest) (*accounting.DownPaymentLink, error)
}

type InvoiceLookup interface {
	Find(ctx context.Context, id uint64) (*accounting.Invoice, error)
	ListOpenByContact(ctx context.Context, contactID uint64) ([]*accounting.Invoice, error)
	ListOpenBySaleOrder(ctx context.Context, orderID uint64) ([]*accounting.Invoice, error)
}

type PaymentEngine interface {
	Create(ctx context.Context, request accounting.CreatePaymentRequest) (*accounting.Payment, error)
}
