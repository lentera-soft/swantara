package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/inventory"
)

func writeTransferError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "warehouse transfer write failed", "Failed to process warehouse transfer.",
		httpx.NotFound(inventory.ErrWarehouseTransferNotFound, "Warehouse transfer not found."),
		httpx.Conflict(inventory.ErrWarehouseTransferState, "Warehouse transfer cannot transition in its current state."),
		httpx.Unprocessable(inventory.ErrSameWarehouse, "Source and destination warehouses must differ."),
		httpx.Unprocessable(inventory.ErrWarehouseNotFound, "Warehouse does not exist."),
		httpx.Unprocessable(inventory.ErrTransitNotFound, "No transit location found for this organization."),
		httpx.Unprocessable(inventory.ErrTransitAccount, "A goods in transit account is required."),
		httpx.Unprocessable(inventory.ErrOrganizationMissing, "Organization is required for posting."),
		httpx.Unprocessable(inventory.ErrMovementQty, "Transfer line quantity must be greater than zero."),
		httpx.Conflict(inventory.ErrInsufficientStock, "Insufficient stock to send this transfer."),
		httpx.Unprocessable(inventory.ErrLocationRequired, "A stock location is required."),
		httpx.Unprocessable(inventory.ErrValuationAccount, "Item category has no stock valuation account."),
		httpx.Unprocessable(inventory.ErrNoValuation, "Item has no open cost layers."),
	)
}
