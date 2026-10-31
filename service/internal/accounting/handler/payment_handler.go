package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/accounting"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

type PaymentHandler struct {
	svc accounting.PaymentService
}

func NewPaymentHandler(svc accounting.PaymentService) PaymentHandler {
	return PaymentHandler{svc: svc}
}

func writePaymentError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "payment write failed", "Failed to save payment.",
		httpx.NotFound(accounting.ErrPaymentNotFound, "Payment not found."),
		httpx.NotFound(accounting.ErrInvoiceNotFound, "Invoice not found."),
		httpx.Unprocessable(accounting.ErrPaymentAmount, "Payment is invalid: it must have a positive amount, at least one open posted invoice, and not exceed the open balance."),
		httpx.Unprocessable(accounting.ErrPaymentNoInvoices, "Payment is invalid: it must have a positive amount, at least one open posted invoice, and not exceed the open balance."),
		httpx.Unprocessable(accounting.ErrOverAllocation, "Payment is invalid: it must have a positive amount, at least one open posted invoice, and not exceed the open balance."),
		httpx.Unprocessable(accounting.ErrInvoiceNotPosted, "Payment is invalid: it must have a positive amount, at least one open posted invoice, and not exceed the open balance."),
		httpx.Unprocessable(accounting.ErrNoBankAccount, "No bank or cash account configured for the journal."),
		httpx.Unprocessable(accounting.ErrNoReceivableAccount, "No receivable account configured for the organization."),
		httpx.Unprocessable(accounting.ErrNoPayableAccount, "No payable account configured for the organization."),
	)
}
