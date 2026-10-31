package handler

import (
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/giftcard"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

func writeGiftCardError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "gift card write failed", "Failed to process request.",
		httpx.NotFound(giftcard.ErrGiftCardNotFound, "Gift card not found."),
		httpx.Unprocessable(giftcard.ErrGiftCardCodeRequired, "Request cannot be processed."),
		httpx.Unprocessable(giftcard.ErrGiftCardAmountInvalid, "Request cannot be processed."),
		httpx.Unprocessable(giftcard.ErrGiftCardInactive, "Request cannot be processed."),
		httpx.Unprocessable(giftcard.ErrGiftCardExpired, "Request cannot be processed."),
		httpx.Unprocessable(giftcard.ErrGiftCardInsufficient, "Request cannot be processed."),
		httpx.Unprocessable(giftcard.ErrGiftCardAccounts, "Request cannot be processed."),
		httpx.Unprocessable(giftcard.ErrGiftCardLiabilityOnly, "Request cannot be processed."),
		httpx.Unprocessable(giftcard.ErrGiftCardRevenue, "Request cannot be processed."),
		httpx.Unprocessable(giftcard.ErrGiftCardRefundAccount, "Request cannot be processed."),
		httpx.Unprocessable(giftcard.ErrGiftCardForfeitAccount, "Request cannot be processed."),
		httpx.Unprocessable(giftcard.ErrGiftCardAlreadyExists, "Request cannot be processed."),
	)
}

func parseOptionalDate(raw string) (time.Time, error) {
	if raw == "" {
		return time.Time{}, nil
	}
	return helper.ParseDateStr(raw)
}
