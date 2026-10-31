package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/inventory"
)

type ReorderHandler struct {
	svc inventory.ReorderService
}

func NewReorderHandler(svc inventory.ReorderService) ReorderHandler {
	return ReorderHandler{svc: svc}
}

func writeReorderError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "reorder rule write failed", "Failed to save reorder rule.",
		httpx.Unprocessable(inventory.ErrInvalidRuleQty, "Minimum, maximum and multiple quantities are invalid."),
		httpx.Unprocessable(inventory.ErrLocationRequired, "A stock location is required."),
	)
}
