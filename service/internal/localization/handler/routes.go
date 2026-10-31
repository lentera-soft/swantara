package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

func (h ProfileHandler) Register(api fiber.Router, guards httpx.RouteGuards) {
	profiles := api.Group("/localization-profiles", guards.AuthN)

	profiles.Get("/", guards.Guard("localization", "view"), h.List)
	profiles.Post("/", guards.Guard("localization", "create"), httpx.IdempotencyGuard(guards.Idempotency, "localization-profile-create"), h.Create)
	profiles.Get("/:id", guards.Guard("localization", "view"), h.Get)
	profiles.Put("/:id", guards.Guard("localization", "update"), httpx.IdempotencyGuard(guards.Idempotency, "localization-profile-update"), h.Update)
	profiles.Delete("/:id", guards.Guard("localization", "delete"), httpx.IdempotencyGuard(guards.Idempotency, "localization-profile-delete"), h.Delete)
	profiles.Get("/:id/tax-templates", guards.Guard("localization", "view"), h.ListTaxTemplates)
	profiles.Put("/:id/tax-templates", guards.Guard("localization", "update"), httpx.IdempotencyGuard(guards.Idempotency, "localization-tax-template-replace"), h.ReplaceTaxTemplates)
}

func (h ProfileHandler) RegisterOrg(orgAPI fiber.Router, guards httpx.RouteGuards) {
	profiles := orgAPI.Group("/localization-profiles", guards.AuthN)

	profiles.Post("/:id/apply", guards.Guard("localization", "update"), httpx.IdempotencyGuard(guards.Idempotency, "localization-profile-apply"), h.Apply)
}
