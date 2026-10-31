package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

func (h SystemConfigHandler) Register(api fiber.Router, guards httpx.RouteGuards) {
	configs := api.Group("/system-configs", guards.AuthN)

	configs.Get("/", guards.Guard("system-config", "view"), h.List)
	configs.Post("/", guards.Guard("system-config", "create"), httpx.IdempotencyGuard(guards.Idempotency, "system-config-create"), h.Create)
	configs.Get("/:id", guards.Guard("system-config", "view"), h.Get)
	configs.Put("/:id", guards.Guard("system-config", "update"), httpx.IdempotencyGuard(guards.Idempotency, "system-config-update"), h.Update)
	configs.Delete("/:id", guards.Guard("system-config", "delete"), httpx.IdempotencyGuard(guards.Idempotency, "system-config-delete"), h.Delete)
}

func (h IntegrationEventHandler) Register(api fiber.Router, guards httpx.RouteGuards) {
	events := api.Group("/integration-events", guards.AuthN)

	events.Get("/", guards.Guard("integration-event", "view"), h.List)
	events.Get("/:id", guards.Guard("integration-event", "view"), h.Get)
	events.Post("/:id/dispatch", guards.Guard("integration-event", "update"), httpx.IdempotencyGuard(guards.Idempotency, "integration-event-dispatch"), h.Dispatch)
}

func (h WebhookSubscriptionHandler) Register(api fiber.Router, guards httpx.RouteGuards) {
	subscriptions := api.Group("/webhook-subscriptions", guards.AuthN)

	subscriptions.Get("/", guards.Guard("webhook_subscription", "view"), h.List)
	subscriptions.Post("/", guards.Guard("webhook_subscription", "create"), httpx.IdempotencyGuard(guards.Idempotency, "webhook-subscription-create"), h.Create)
	subscriptions.Get("/:id", guards.Guard("webhook_subscription", "view"), h.Get)
	subscriptions.Put("/:id", guards.Guard("webhook_subscription", "update"), httpx.IdempotencyGuard(guards.Idempotency, "webhook-subscription-update"), h.Update)
	subscriptions.Delete("/:id", guards.Guard("webhook_subscription", "delete"), httpx.IdempotencyGuard(guards.Idempotency, "webhook-subscription-delete"), h.Delete)

	deliveries := api.Group("/webhook-deliveries", guards.AuthN)

	deliveries.Get("/", guards.Guard("webhook_delivery", "view"), h.ListDeliveries)
	deliveries.Get("/:id", guards.Guard("webhook_delivery", "view"), h.GetDelivery)
}
