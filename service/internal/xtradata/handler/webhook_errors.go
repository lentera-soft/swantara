package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/xtradata"
)

func writeWebhookSubscriptionError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "webhook subscription write failed", "Failed to save webhook subscription.",
		httpx.Unprocessable(xtradata.ErrWebhookURLRequired, "Webhook url is required."),
		httpx.NotFound(xtradata.ErrWebhookSubscriptionMissing, "Webhook subscription not found."),
	)
}
