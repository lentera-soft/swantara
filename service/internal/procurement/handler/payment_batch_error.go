package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/procurement"
)

func writePaymentBatchError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "payment batch write failed", "Failed to process payment batch.",
		httpx.NotFound(procurement.ErrPaymentBatchNotFound, "Payment batch not found."),
		httpx.Unprocessable(procurement.ErrPaymentBatchNoOrders, "Payment batch must have at least one order."),
		httpx.Unprocessable(procurement.ErrPaymentBatchMixedVendors, "All orders must belong to the same supplier."),
		httpx.Unprocessable(procurement.ErrPaymentBatchInvalidOrderState, "One or more orders are not in a valid state."),
		httpx.Unprocessable(procurement.ErrPaymentBatchInvalidAmount, "Amount must be positive."),
		httpx.Unprocessable(procurement.ErrPaymentBatchInvalidState, "Payment batch is not in a valid state."),
	)
}
