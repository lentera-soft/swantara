package sales

import (
	"time"

	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
)

const (
	OrderStateDraft     = "draft"
	OrderStateSent      = "sent"
	OrderStateConfirmed = "confirmed"
	OrderStateDone      = "done"
	OrderStateCancelled = "cancelled"

	InvoiceStatusNo        = "no"
	InvoiceStatusToInvoice = "to_invoice"
	InvoiceStatusInvoiced  = "invoiced"

	DeliveryStatusPending = "pending"
	DeliveryStatusPartial = "partial"
	DeliveryStatusDone    = "done"

	QuoteStateDraft     = "draft"
	QuoteStateSent      = "sent"
	QuoteStateAccepted  = "accepted"
	QuoteStateExpired   = "expired"
	QuoteStateCancelled = "cancelled"

	SequenceSaleOrderCode = "sale_order"
	SequenceSaleQuoteCode = "sale_quote"
)

type SaleOrder struct {
	model.Base
	OrganizationID *uint64    `json:"organization_id"`
	Name           *string    `json:"name"`
	ContactID      uint64     `gorm:"not null" json:"contact_id"`
	ShipAddressID  *uint64    `json:"ship_address_id"`
	BillAddressID  *uint64    `json:"bill_address_id"`
	PriceBookID    *uint64    `json:"price_book_id"`
	CurrencyCode   *string    `gorm:"type:char(3)" json:"currency_code"`
	SalespersonID  *uint64    `json:"salesperson_id"`
	SalesGroupID   *uint64    `json:"sales_group_id"`
	ProspectID     *uint64    `json:"prospect_id"`
	QuoteID        *uint64    `json:"quote_id"`
	WarehouseID    *uint64    `json:"warehouse_id"`
	State          string     `gorm:"type:text" json:"state"`
	OrderDate      *time.Time `gorm:"type:date" json:"order_date"`
	ExpectedDate   *time.Time `gorm:"type:date" json:"expected_date"`
	ValidityDate   *time.Time `gorm:"type:date" json:"validity_date"`
	PaymentTermID  *uint64    `json:"payment_term_id"`
	Incoterm       *string    `json:"incoterm"`
	CustomerPORef  *string    `json:"customer_po_ref"`
	AmountUntaxed  float64    `gorm:"type:numeric(18,4);default:0" json:"amount_untaxed"`
	AmountTax      float64    `gorm:"type:numeric(18,4);default:0" json:"amount_tax"`
	AmountTotal    float64    `gorm:"type:numeric(18,4);default:0" json:"amount_total"`
	InvoiceStatus  string     `gorm:"type:text" json:"invoice_status"`
	DeliveryStatus string     `gorm:"type:text" json:"delivery_status"`
	Note           *string    `json:"note"`

	AllowMultipleOrders bool `gorm:"-" json:"allow_multiple_orders,omitempty"`
}

func (SaleOrder) TableName() string {
	return "sale_orders"
}

type SaleOrderLine struct {
	model.Base
	OrderID       uint64            `gorm:"not null" json:"order_id"`
	Sequence      int               `gorm:"default:10" json:"sequence"`
	ItemID        *uint64           `json:"item_id"`
	Description   *string           `json:"description"`
	QtyOrdered    float64           `gorm:"type:numeric(18,4);not null" json:"qty_ordered"`
	QtyDelivered  float64           `gorm:"type:numeric(18,4);default:0" json:"qty_delivered"`
	QtyInvoiced   float64           `gorm:"type:numeric(18,4);default:0" json:"qty_invoiced"`
	QtyReturns    float64           `gorm:"type:numeric(18,4);default:0" json:"qty_returns"`
	UnitID        *uint64           `json:"unit_id"`
	UnitPrice     float64           `gorm:"type:numeric(18,4)" json:"unit_price"`
	DiscountPct   float64           `gorm:"type:numeric(8,4);default:0" json:"discount_pct"`
	TaxIDs        helper.Int64Array `gorm:"type:bigint[]" json:"tax_ids"`
	DimensionID   *uint64           `json:"dimension_id"`
	PriceSubtotal float64           `gorm:"type:numeric(18,4)" json:"price_subtotal"`
	PriceTax      float64           `gorm:"type:numeric(18,4)" json:"price_tax"`
	PriceTotal    float64           `gorm:"type:numeric(18,4)" json:"price_total"`
}

func (SaleOrderLine) TableName() string {
	return "sale_order_lines"
}

type SaleQuote struct {
	model.Base
	OrganizationID  *uint64    `json:"organization_id"`
	Name            *string    `json:"name"`
	ContactID       uint64     `gorm:"not null" json:"contact_id"`
	PriceBookID     *uint64    `json:"price_book_id"`
	CurrencyCode    *string    `gorm:"type:char(3)" json:"currency_code"`
	SalespersonID   *uint64    `json:"salesperson_id"`
	SalesGroupID    *uint64    `json:"sales_group_id"`
	ProspectID      *uint64    `json:"prospect_id"`
	State           string     `gorm:"type:text" json:"state"`
	QuoteDate       *time.Time `gorm:"type:date" json:"quote_date"`
	ValidityDate    *time.Time `gorm:"type:date" json:"validity_date"`
	PaymentTermID   *uint64    `json:"payment_term_id"`
	Incoterm        *string    `json:"incoterm"`
	CustomerPORef   *string    `json:"customer_po_ref"`
	AmountUntaxed   float64    `gorm:"type:numeric(18,4);default:0" json:"amount_untaxed"`
	AmountTax       float64    `gorm:"type:numeric(18,4);default:0" json:"amount_tax"`
	AmountTotal     float64    `gorm:"type:numeric(18,4);default:0" json:"amount_total"`
	ExpectedRevenue *float64   `gorm:"type:numeric(18,4)" json:"expected_revenue"`
	Version         int        `gorm:"not null;default:1" json:"version"`
	RootQuoteID     *uint64    `json:"root_quote_id"`
	PreviousQuoteID *uint64    `json:"previous_quote_id"`
	IsCurrent       bool       `gorm:"not null;default:true" json:"is_current"`
	AcceptedAt      *time.Time `json:"accepted_at"`
	SaleOrderID     *uint64    `json:"sale_order_id"`
	Note            *string    `json:"note"`
}

func (SaleQuote) TableName() string {
	return "sale_quotes"
}

type SaleQuoteLine struct {
	model.Base
	QuoteID       uint64            `gorm:"not null" json:"quote_id"`
	Sequence      int               `gorm:"default:10" json:"sequence"`
	ItemID        *uint64           `json:"item_id"`
	Description   *string           `json:"description"`
	Qty           float64           `gorm:"type:numeric(18,4);not null" json:"qty"`
	UnitID        *uint64           `json:"unit_id"`
	UnitPrice     float64           `gorm:"type:numeric(18,4);default:0" json:"unit_price"`
	DiscountPct   float64           `gorm:"type:numeric(8,4);default:0" json:"discount_pct"`
	TaxIDs        helper.Int64Array `gorm:"type:bigint[]" json:"tax_ids"`
	DimensionID   *uint64           `json:"dimension_id"`
	PriceSubtotal float64           `gorm:"type:numeric(18,4);default:0" json:"price_subtotal"`
	PriceTax      float64           `gorm:"type:numeric(18,4);default:0" json:"price_tax"`
	PriceTotal    float64           `gorm:"type:numeric(18,4);default:0" json:"price_total"`
}

func (SaleQuoteLine) TableName() string {
	return "sale_quote_lines"
}
