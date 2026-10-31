package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/kernel/sequence"
	"github.com/jalusw/swantara/apps/service/internal/manufacturing"
)

func writeProductionError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "production write failed", "Failed to process production operation.",
		httpx.NotFound(manufacturing.ErrProductionOrderNotFound, "Production order not found."),
		httpx.Conflict(manufacturing.ErrProductionOrderState, "Production order state does not allow this operation."),
		httpx.Unprocessable(manufacturing.ErrProductionOrderRecipe, "Production order recipe is missing."),
		httpx.Unprocessable(manufacturing.ErrProductionOrderOrganization, "Production order requires an organization."),
		httpx.Unprocessable(manufacturing.ErrProductionOrderLocation, "Production order location does not exist."),
		httpx.NotFound(manufacturing.ErrShopTaskNotFound, "Shop task not found."),
		httpx.Unprocessable(manufacturing.ErrShopTaskWorkCenter, "Shop task work center does not exist."),
		httpx.Unprocessable(manufacturing.ErrShopTaskMismatch, "Shop task does not belong to the production order."),
		httpx.Unprocessable(manufacturing.ErrShopTaskLabor, "Shop task labor hours must be greater than zero."),
		httpx.Unprocessable(manufacturing.ErrConsumeComponent, "Component does not belong to the production order."),
		httpx.Unprocessable(manufacturing.ErrConsumeQuantity, "Consume quantity exceeds the remaining component quantity."),
		httpx.Unprocessable(manufacturing.ErrProduceQuantity, "Produce quantity exceeds the remaining quantity to produce."),
		httpx.Unprocessable(manufacturing.ErrProductionLocation, "Production location does not exist."),
		httpx.Unprocessable(manufacturing.ErrWIPAccount, "Work in progress account is required."),
		httpx.Unprocessable(manufacturing.ErrLaborAccount, "Applied labor account is required."),
		httpx.Unprocessable(manufacturing.ErrVarianceAccount, "Manufacturing variance account is required."),
		httpx.Conflict(manufacturing.ErrShopTaskState, "Shop task state does not allow this operation."),
		httpx.Unprocessable(manufacturing.ErrShopTaskStep, "Shop task routing operation does not exist."),
		httpx.Unprocessable(sequence.ErrSequenceNotFound, "Shop task document sequence is not configured."),
		httpx.NotFound(manufacturing.ErrMovementNotFound, "Stock movement not found."),
		httpx.Conflict(manufacturing.ErrMovementState, "Stock movement state does not allow this operation."),
		httpx.Conflict(manufacturing.ErrInsufficientStock, "Insufficient stock to consume raw materials."),
		httpx.Unprocessable(manufacturing.ErrNotConsumption, "Movement is not routed to a production location."),
		httpx.Unprocessable(manufacturing.ErrNotProduction, "Movement does not originate from a production location."),
		httpx.Unprocessable(manufacturing.ErrValuationAccount, "Item category has no stock valuation account."),
		httpx.Unprocessable(manufacturing.ErrNegativeCost, "Unit cost cannot be negative."),
		httpx.Unprocessable(manufacturing.ErrBatchRequired, "Item requires a lot or serial number."),
		httpx.Internal(manufacturing.ErrConsumeMovement, "production write failed", "Failed to create consumption movement."),
		httpx.Internal(manufacturing.ErrProduceMovement, "production write failed", "Failed to create production movement."),
	)
}
