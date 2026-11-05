package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

func (h ProspectHandler) Register(api fiber.Router, guards httpx.RouteGuards) {
	leads := api.Group("/crm/leads", guards.AuthN)

	leads.Get("/", guards.Guard("prospect", "view"), h.List)
	leads.Post("/", guards.Guard("prospect", "create"), httpx.IdempotencyGuard(guards.Idempotency, "crm-prospect-create"), h.Create)
	leads.Post("/reassign", guards.Guard("prospect", "update"), httpx.IdempotencyGuard(guards.Idempotency, "crm-prospect-reassign"), h.ReassignOwners)
	leads.Get("/:id", guards.Guard("prospect", "view"), h.Get)
	leads.Put("/:id", guards.Guard("prospect", "update"), httpx.IdempotencyGuard(guards.Idempotency, "crm-prospect-update"), h.Update)
	leads.Delete("/:id", guards.Guard("prospect", "delete"), httpx.IdempotencyGuard(guards.Idempotency, "crm-prospect-delete"), h.Delete)
	leads.Post("/:id/promote", guards.Guard("prospect", "promote"), httpx.IdempotencyGuard(guards.Idempotency, "crm-prospect-promote"), h.Promote)
	leads.Post("/:id/status", guards.Guard("prospect", "update"), httpx.IdempotencyGuard(guards.Idempotency, "crm-prospect-status"), h.TransitionStatus)
	leads.Post("/:id/owner", guards.Guard("prospect", "update"), httpx.IdempotencyGuard(guards.Idempotency, "crm-prospect-owner"), h.ReassignOwner)
	leads.Get("/:id/duplicates", guards.Guard("prospect", "view"), h.Duplicates)
	leads.Post("/:id/merge", guards.Guard("prospect", "update"), httpx.IdempotencyGuard(guards.Idempotency, "crm-prospect-merge"), h.Merge)
	leads.Get("/:id/history", guards.Guard("prospect", "view"), h.StageHistory)
	leads.Get("/:id/buyers", guards.Guard("prospect", "view"), h.ListBuyers)
	leads.Post("/:id/buyers", guards.Guard("prospect", "update"), httpx.IdempotencyGuard(guards.Idempotency, "crm-lead-buyer-add"), h.AddBuyer)
	leads.Delete("/:id/buyers/:buyer_id", guards.Guard("prospect", "update"), httpx.IdempotencyGuard(guards.Idempotency, "crm-lead-buyer-remove"), h.RemoveBuyer)
}

func (h OpportunityHandler) Register(api fiber.Router, guards httpx.RouteGuards) {
	opportunities := api.Group("/crm/opportunities", guards.AuthN)

	opportunities.Get("/", guards.Guard("prospect", "view"), h.List)
	opportunities.Post("/", guards.Guard("prospect", "create"), httpx.IdempotencyGuard(guards.Idempotency, "crm-opportunity-create"), h.Create)
	opportunities.Get("/:id", guards.Guard("prospect", "view"), h.Get)
	opportunities.Put("/:id", guards.Guard("prospect", "update"), httpx.IdempotencyGuard(guards.Idempotency, "crm-opportunity-update"), h.Update)
	opportunities.Delete("/:id", guards.Guard("prospect", "delete"), httpx.IdempotencyGuard(guards.Idempotency, "crm-opportunity-delete"), h.Delete)
	opportunities.Post("/:id/advance-stage", guards.Guard("prospect", "update"), httpx.IdempotencyGuard(guards.Idempotency, "crm-opportunity-advance-stage"), h.AdvanceStage)
	opportunities.Post("/:id/win", guards.Guard("prospect", "update"), httpx.IdempotencyGuard(guards.Idempotency, "crm-opportunity-win"), h.Win)
	opportunities.Post("/:id/lose", guards.Guard("prospect", "update"), httpx.IdempotencyGuard(guards.Idempotency, "crm-opportunity-lose"), h.Lose)
	opportunities.Post("/:id/owner", guards.Guard("prospect", "update"), httpx.IdempotencyGuard(guards.Idempotency, "crm-opportunity-owner"), h.ReassignOwner)
	opportunities.Get("/:id/history", guards.Guard("prospect", "view"), h.StageHistory)
	opportunities.Get("/:id/buyers", guards.Guard("prospect", "view"), h.ListBuyers)
	opportunities.Post("/:id/buyers", guards.Guard("prospect", "update"), httpx.IdempotencyGuard(guards.Idempotency, "crm-opportunity-buyer-add"), h.AddBuyer)
	opportunities.Delete("/:id/buyers/:buyer_id", guards.Guard("prospect", "update"), httpx.IdempotencyGuard(guards.Idempotency, "crm-opportunity-buyer-remove"), h.RemoveBuyer)
}

func (h ProspectActivityHandler) Register(api fiber.Router, guards httpx.RouteGuards) {
	activities := api.Group("/crm/activities", guards.AuthN)

	activities.Get("/", guards.Guard("prospect_activity", "view"), h.List)
	activities.Post("/", guards.Guard("prospect_activity", "create"), httpx.IdempotencyGuard(guards.Idempotency, "crm-activity-create"), h.Create)
	activities.Get("/:id", guards.Guard("prospect_activity", "view"), h.Get)
	activities.Put("/:id", guards.Guard("prospect_activity", "update"), httpx.IdempotencyGuard(guards.Idempotency, "crm-activity-update"), h.Update)
	activities.Delete("/:id", guards.Guard("prospect_activity", "delete"), httpx.IdempotencyGuard(guards.Idempotency, "crm-activity-delete"), h.Delete)
	activities.Post("/:id/complete", guards.Guard("prospect_activity", "update"), httpx.IdempotencyGuard(guards.Idempotency, "crm-activity-complete"), h.MarkDone)
}

func (h PipelineHandler) Register(api fiber.Router, guards httpx.RouteGuards) {
	pipeline := api.Group("/crm", guards.AuthN)

	pipeline.Get("/pipeline", guards.Guard("prospect", "view"), h.Forecast)
}

func (h PipelineStageHandler) Register(api fiber.Router, guards httpx.RouteGuards) {
	stages := api.Group("/crm", guards.AuthN)

	stages.Get("/stages", guards.Guard("pipeline_stage", "view"), h.List)
}

func (h SalesGroupHandler) Register(api fiber.Router, guards httpx.RouteGuards) {
	teams := api.Group("/crm", guards.AuthN)

	teams.Get("/teams", guards.Guard("sales_group", "view"), h.List)
	teams.Post("/teams", guards.Guard("sales_group", "create"), httpx.IdempotencyGuard(guards.Idempotency, "crm-sales-group-create"), h.Create)
	teams.Get("/teams/:id", guards.Guard("sales_group", "view"), h.Get)
	teams.Put("/teams/:id", guards.Guard("sales_group", "update"), httpx.IdempotencyGuard(guards.Idempotency, "crm-sales-group-update"), h.Update)
	teams.Delete("/teams/:id", guards.Guard("sales_group", "delete"), httpx.IdempotencyGuard(guards.Idempotency, "crm-sales-group-delete"), h.Delete)
}
