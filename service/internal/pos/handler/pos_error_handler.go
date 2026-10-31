package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/giftcard"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/pos"
)

func writePOSError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "pos write failed", "Failed to process POS request.",
		httpx.Unprocessable(pos.ErrConfigNotFound, "POS config does not exist."),
		httpx.NotFound(pos.ErrSessionNotFound, "POS session not found."),
		httpx.Conflict(pos.ErrSessionState, "POS session cannot be processed in its current state."),
		httpx.Conflict(pos.ErrSessionOpen, "A POS session for this config is already open."),
		httpx.NotFound(pos.ErrOrderNotFound, "POS order not found."),
		httpx.Unprocessable(pos.ErrOrderNoLines, "POS order must have at least one line."),
		httpx.Unprocessable(pos.ErrOrderProduct, "POS order line item is required."),
		httpx.Unprocessable(pos.ErrOrderQty, "POS order line quantity must be positive."),
		httpx.Unprocessable(pos.ErrOrderDiscount, "POS order line discount must be between 0 and 100."),
		httpx.Unprocessable(pos.ErrOrderTax, "POS order line tax is invalid."),
		httpx.Conflict(pos.ErrOrderStockUnavailable, "POS order quantity is not available in stock."),
		httpx.Unprocessable(pos.ErrOrderNoStock, "POS order cannot create stock movements."),
		httpx.Unprocessable(pos.ErrPaymentMissing, "POS order requires at least one payment."),
		httpx.Unprocessable(pos.ErrPaymentTotal, "POS payments total must match the order total."),
		httpx.Conflict(pos.ErrOrderInvoiced, "POS order is already invoiced."),
		httpx.Unprocessable(pos.ErrConfigWarehouse, "POS config must define a warehouse."),
		httpx.Unprocessable(pos.ErrConfigJournal, "POS config must define a journal with a default account."),
		httpx.Unprocessable(pos.ErrConfigPriceBook, "POS config must define a price_book."),
		httpx.Unprocessable(pos.ErrConfigDiscountAccount, "POS config must define a discount_account to redeem coupons."),
		httpx.Unprocessable(pos.ErrCouponRequiresWalkIn, "Coupons can only be redeemed on walk-in POS sales."),
		httpx.NotFound(giftcard.ErrCouponNotFound, "Coupon not found."),
		httpx.Unprocessable(giftcard.ErrCouponInactive, "Coupon cannot be redeemed."),
		httpx.Unprocessable(giftcard.ErrCouponExpired, "Coupon cannot be redeemed."),
		httpx.Unprocessable(giftcard.ErrCouponOverLimit, "Coupon cannot be redeemed."),
		httpx.Unprocessable(giftcard.ErrCouponCodeRequired, "Coupon cannot be redeemed."),
		httpx.Unprocessable(pos.ErrNoCashier, "The cashier is not a member of the POS config organization."),
		httpx.Conflict(pos.ErrOrderState, "POS order cannot be processed in its current state."),
		httpx.Unprocessable(pos.ErrOrderCost, "POS order original stock cost cannot be resolved."),
	)
}
