package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

func (h SaleOrderHandler) Register(api fiber.Router, guards httpx.RouteGuards) {
	orders := api.Group("/sale-orders", guards.AuthN)

	orders.Get("/", guards.Guard("sale_order", "view"), h.List)
	orders.Post("/", guards.Guard("sale_order", "create"), httpx.IdempotencyGuard(guards.Idempotency, "sale-order-create"), h.Create)
	orders.Get("/:id", guards.Guard("sale_order", "view"), h.Get)
	orders.Put("/:id", guards.Guard("sale_order", "update"), httpx.IdempotencyGuard(guards.Idempotency, "sale-order-update"), h.Update)
	orders.Delete("/:id", guards.Guard("sale_order", "delete"), httpx.IdempotencyGuard(guards.Idempotency, "sale-order-delete"), h.Delete)
	orders.Post("/:id/send", guards.Guard("sale_order", "update"), httpx.IdempotencyGuard(guards.Idempotency, "sale-order-send"), h.Send)
	orders.Post("/:id/confirm", guards.Guard("sale_order", "update"), httpx.IdempotencyGuard(guards.Idempotency, "sale-order-confirm"), h.Confirm)
	orders.Post("/:id/cancel", guards.Guard("sale_order", "update"), httpx.IdempotencyGuard(guards.Idempotency, "sale-order-cancel"), h.Cancel)
	orders.Post("/:id/complete", guards.Guard("sale_order", "update"), httpx.IdempotencyGuard(guards.Idempotency, "sale-order-complete"), h.Done)
	orders.Post("/:id/recompute-statuses", guards.Guard("sale_order", "update"), httpx.IdempotencyGuard(guards.Idempotency, "sale-order-recompute-statuses"), h.RecomputeStatuses)
	orders.Post("/:id/deliver", guards.Guard("sale_order", "update"), httpx.IdempotencyGuard(guards.Idempotency, "sale-order-deliver"), h.Deliver)
	orders.Post("/:id/invoice", guards.Guard("sale_order", "update"), httpx.IdempotencyGuard(guards.Idempotency, "sale-order-invoice"), h.Invoice)
	orders.Post("/:id/advance-invoice", guards.Guard("sale_order", "update"), httpx.IdempotencyGuard(guards.Idempotency, "sale-order-advance-invoice"), h.AdvanceInvoice)
	orders.Post("/:id/deduct-deposit", guards.Guard("sale_order", "update"), httpx.IdempotencyGuard(guards.Idempotency, "sale-order-deduct-deposit"), h.DeductDeposit)
	orders.Post("/:id/pay", guards.Guard("sale_order", "update"), httpx.IdempotencyGuard(guards.Idempotency, "sale-order-pay"), h.Pay)
}

func (h SaleQuoteHandler) Register(api fiber.Router, guards httpx.RouteGuards) {
	quotes := api.Group("/sale-quotes", guards.AuthN)

	quotes.Get("/", guards.Guard("sale_quote", "view"), h.List)
	quotes.Post("/", guards.Guard("sale_quote", "create"), httpx.IdempotencyGuard(guards.Idempotency, "sale-quote-create"), h.Create)
	quotes.Get("/:id", guards.Guard("sale_quote", "view"), h.Get)
	quotes.Put("/:id", guards.Guard("sale_quote", "update"), httpx.IdempotencyGuard(guards.Idempotency, "sale-quote-update"), h.Update)
	quotes.Delete("/:id", guards.Guard("sale_quote", "delete"), httpx.IdempotencyGuard(guards.Idempotency, "sale-quote-delete"), h.Delete)
	quotes.Get("/:id/history", guards.Guard("sale_quote", "view"), h.History)
	quotes.Post("/:id/send", guards.Guard("sale_quote", "update"), httpx.IdempotencyGuard(guards.Idempotency, "sale-quote-send"), h.Send)
	quotes.Post("/:id/accept", guards.Guard("sale_quote", "update"), httpx.IdempotencyGuard(guards.Idempotency, "sale-quote-accept"), h.Accept)
	quotes.Post("/:id/cancel", guards.Guard("sale_quote", "update"), httpx.IdempotencyGuard(guards.Idempotency, "sale-quote-cancel"), h.Cancel)
	quotes.Post("/:id/expire", guards.Guard("sale_quote", "update"), httpx.IdempotencyGuard(guards.Idempotency, "sale-quote-expire"), h.Expire)
	quotes.Post("/:id/revise", guards.Guard("sale_quote", "update"), httpx.IdempotencyGuard(guards.Idempotency, "sale-quote-revise"), h.Revise)
}
