package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/accounting"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

func writePaymentBatchError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "payment batch write failed", "Failed to save payment batch.",
		httpx.NotFound(accounting.ErrBatchNotFound, "Payment batch not found."),
		httpx.NotFound(accounting.ErrEntryNotFound, "Payment batch not found."),
		httpx.NotFound(accounting.ErrPaymentNotFound, "Payment not found."),
		httpx.Unprocessable(accounting.ErrBatchNoPayments, "Payment batch must have at least one payment."),
		httpx.Unprocessable(accounting.ErrPaymentNoInvoices, "Payment batch must have at least one payment."),
		httpx.Conflict(accounting.ErrBatchNotDraft, "Invalid payment batch state."),
		httpx.Conflict(accounting.ErrEntryNotPosted, "Invalid payment batch state."),
		httpx.Conflict(accounting.ErrInvalidPeriodState, "Invalid payment batch state."),
	)
}
