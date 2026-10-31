package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/kernel/sequence"
	"github.com/jalusw/swantara/apps/service/internal/manufacturing"
)

func writeProductionOrderError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "production order write failed", "Failed to process production order.",
		httpx.NotFound(manufacturing.ErrProductionOrderNotFound, "Production order not found."),
		httpx.Conflict(manufacturing.ErrProductionOrderState, "Production order state does not allow this operation."),
		httpx.Unprocessable(manufacturing.ErrProductionOrderItem, "Production order item variant does not exist."),
		httpx.Unprocessable(manufacturing.ErrProductionOrderRecipe, "Production order recipe is missing or does not match the item."),
		httpx.Unprocessable(manufacturing.ErrProductionOrderQty, "Production order quantity must be greater than zero."),
		httpx.Unprocessable(manufacturing.ErrProductionOrderOrganization, "Production order requires an organization."),
		httpx.Unprocessable(manufacturing.ErrProductionOrderSequence, "Production order document sequence is not configured."),
		httpx.Unprocessable(manufacturing.ErrProductionOrderLocation, "Production order location does not exist."),
		httpx.Unprocessable(manufacturing.ErrConsumedMaterial, "Production order has no components."),
		httpx.Unprocessable(sequence.ErrSequenceNotFound, "Production order document sequence is not configured."),
		httpx.Conflict(manufacturing.ErrHoldOverflow, "Insufficient stock to reserve production order components."),
		httpx.Conflict(manufacturing.ErrBalanceNotFound, "No stock quant found to reserve production order components."),
		httpx.Internal(manufacturing.ErrProductionOrderReservation, "production order write failed", "Failed to reserve production order components."),
	)
}
