package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/inventory"
)

func writeInboundCostError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "inbound cost write failed", "Failed to save inbound cost.",
		httpx.NotFound(inventory.ErrInboundCostNotFound, "Inbound cost not found."),
		httpx.Conflict(inventory.ErrInboundCostState, "Inbound cost state is invalid for this operation."),
		httpx.Unprocessable(inventory.ErrInboundCostNoLines, "Inbound cost has no lines."),
		httpx.Unprocessable(inventory.ErrInboundCostNoShipments, "Inbound cost has no target shipments."),
		httpx.Unprocessable(inventory.ErrInboundCostNoMovements, "A inbound cost line has no matching receipt movements."),
		httpx.Unprocessable(inventory.ErrInboundCostNoAccount, "A inbound cost line has no clearing account."),
		httpx.Unprocessable(inventory.ErrInboundCostNoJournal, "Inbound cost journal is not configured for this organization."),
		httpx.Unprocessable(inventory.ErrInboundCostSplit, "Invalid inbound cost split method."),
		httpx.Unprocessable(inventory.ErrInboundCostValue, "Inbound cost value split requires received movements with a valuation layer."),
		httpx.Unprocessable(inventory.ErrValuationAccount, "Item category has no stock valuation account."),
		httpx.Unprocessable(inventory.ErrOrganizationMissing, "Organization is required for posting."),
	)
}
