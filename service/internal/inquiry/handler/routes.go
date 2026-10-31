package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

func (h ContactInquiryHandler) RegisterPublic(api fiber.Router) {
	inquiries := api.Group("/contact-inquiries")
	inquiries.Post("/", httpx.AuthRateLimitGuard(), h.Create)
}

func (h ContactInquiryHandler) RegisterOrg(api fiber.Router, guards httpx.RouteGuards) {
	inquiries := api.Group("/crm/inquiries", guards.AuthN)

	inquiries.Get("/", guards.Guard("prospect", "view"), h.List)
	inquiries.Get("/:id", guards.Guard("prospect", "view"), h.Get)
	inquiries.Post("/:id/status", guards.Guard("prospect", "update"), httpx.IdempotencyGuard(guards.Idempotency, "crm-inquiry-status"), h.UpdateStatus)
	inquiries.Post("/:id/convert", guards.Guard("prospect", "create"), httpx.IdempotencyGuard(guards.Idempotency, "crm-inquiry-convert"), h.Convert)
}
