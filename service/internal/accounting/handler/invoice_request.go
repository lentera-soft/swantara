package handler

import (
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/accounting"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/reference"

	"github.com/jalusw/swantara/apps/service/internal/kernel/clock"
)

type InvoiceLineRequest struct {
	ItemID      *uint64           `json:"item_id"`
	Description string            `json:"description"`
	Qty         float64           `json:"qty" validate:"required,gt=0"`
	UnitID      *uint64           `json:"unit_id"`
	UnitPrice   float64           `json:"unit_price" validate:"gte=0"`
	DiscountPct float64           `json:"discount_pct" validate:"gte=0,lte=100"`
	TaxIDs      helper.Int64Array `json:"tax_ids"`
	AccountID   uint64            `json:"account_id" validate:"required,gt=0"`
	DimensionID *uint64           `json:"dimension_id"`
}

type CreateInvoiceRequest struct {
	OrganizationID *uint64              `json:"organization_id"`
	JournalID      uint64               `json:"journal_id" validate:"required,gt=0"`
	ContactID      uint64               `json:"contact_id" validate:"required,gt=0"`
	Date           *string              `json:"date"`
	DueDate        *string              `json:"due_date"`
	Reference      string               `json:"reference"`
	CurrencyCode   *string              `json:"currency_code" validate:"omitempty,len=3"`
	Draft          bool                 `json:"draft"`
	PaymentTermID  *uint64              `json:"payment_term_id"`
	TaxRuleID      *uint64              `json:"tax_rule_id"`
	Lines          []InvoiceLineRequest `json:"lines" validate:"required,min=1,dive"`
}

type WriteOffBadDebtRequest struct {
	OrganizationID   *uint64 `json:"organization_id"`
	ExpenseAccountID uint64  `json:"expense_account_id" validate:"required,gt=0"`
	Date             *string `json:"date"`
}

type CreateCreditNoteRequest struct {
	OrganizationID *uint64 `json:"organization_id"`
	JournalID      uint64  `json:"journal_id" validate:"required,gt=0"`
	Date           *string `json:"date"`
	DueDate        *string `json:"due_date"`
	Reference      string  `json:"reference"`
}

var invoiceQueryAllowlist = map[string]struct{}{
	"organization_id": {},
	"contact_id":      {},
	"type":            {},
	"state":           {},
	"payment_state":   {},
	"journal_id":      {},
	"name":            {},
	"reference":       {},
	"invoice_date":    {},
	"due_date":        {},
	"created_at":      {},
	"updated_at":      {},
}

func invoiceDate(date *time.Time) time.Time {
	if date == nil || date.IsZero() {
		return clock.Now().UTC()
	}
	return *date
}

func writeInvoiceError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "invoice write failed", "Failed to save invoice.",
		httpx.NotFound(accounting.ErrInvoiceNotFound, "Invoice not found."),
		httpx.Conflict(accounting.ErrInvoiceNotPosted, "Only posted invoices can be reversed."),
		httpx.Conflict(accounting.ErrInvoiceNotDraft, "Only draft invoices can be posted."),
		httpx.Conflict(accounting.ErrBadDebtNotAllowed, "Only posted customer invoices with an open balance can be written off."),
		httpx.Conflict(accounting.ErrInvoiceReversed, "Invoice is already settled."),
		httpx.Conflict(accounting.ErrInvoicePaid, "Invoice is already settled."),
		httpx.Unprocessable(accounting.ErrInvoiceNoLines, "Invoice lines are invalid."),
		httpx.Unprocessable(accounting.ErrInvoiceLineQty, "Invoice lines are invalid."),
		httpx.Unprocessable(accounting.ErrInvoiceTaxInvalid, "Invoice lines are invalid."),
		httpx.Unprocessable(accounting.ErrInvoiceSequence, "Invoice lines are invalid."),
		httpx.Unprocessable(accounting.ErrTaxRuleNotFound, "Payment term or fiscal position is invalid."),
		httpx.Unprocessable(reference.ErrTermNotFound, "Payment term or fiscal position is invalid."),
		httpx.Unprocessable(reference.ErrInvalidTermLines, "Payment term or fiscal position is invalid."),
		httpx.Unprocessable(accounting.ErrNoReceivableAccount, "No receivable account configured for the organization."),
		httpx.Unprocessable(accounting.ErrNoPayableAccount, "No payable account configured for the organization."),
		httpx.Unprocessable(accounting.ErrNoRevenueAccount, "No revenue account configured for the item."),
		httpx.Unprocessable(accounting.ErrCreditMismatch, "Credit note does not match the invoice."),
		httpx.Unprocessable(accounting.ErrOverAllocation, "Settlement amount exceeds the open balance."),
		httpx.Unprocessable(accounting.ErrPaymentAmount, "Settlement amount must be positive."),
		httpx.Unprocessable(accounting.ErrCurrencyMismatch, "Documents must share the same currency to net."),
		httpx.Unprocessable(accounting.ErrCreditLimitExceeded, "Contact credit limit exceeded."),
	)
}
