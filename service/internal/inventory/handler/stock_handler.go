package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/inventory"
)

type StockHandler struct {
	stock     inventory.StockService
	ledger    inventory.LedgerService
	valuation inventory.ValuationService
}

func NewStockHandler(
	stock inventory.StockService,
	ledger inventory.LedgerService,
	valuation inventory.ValuationService,
) StockHandler {
	return StockHandler{stock: stock, ledger: ledger, valuation: valuation}
}

func writeStockError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "stock write failed", "Failed to process stock operation.",
		httpx.NotFound(inventory.ErrMovementNotFound, "Stock movement not found."),
		httpx.Unprocessable(inventory.ErrMovementItem, "Stock movement item variant is required."),
		httpx.Unprocessable(inventory.ErrMovementQty, "Stock movement quantity must be greater than zero."),
		httpx.Conflict(inventory.ErrMovementState, "Stock movement cannot be processed in its current state."),
		httpx.Unprocessable(inventory.ErrLocationNotFound, "Stock location does not exist."),
		httpx.Conflict(inventory.ErrInsufficientStock, "Insufficient stock for this movement."),
		httpx.Unprocessable(inventory.ErrNotReceipt, "Movement source is not a supplier location."),
		httpx.Unprocessable(inventory.ErrNotShipment, "Movement destination is not a customer location."),
		httpx.Unprocessable(inventory.ErrBatchRequired, "A batch is required for this item."),
		httpx.Unprocessable(inventory.ErrNegativeCost, "Unit cost cannot be negative."),
		httpx.Unprocessable(inventory.ErrOrganizationMissing, "Organization is required for posting."),
		httpx.Unprocessable(inventory.ErrValuationAccount, "Item category has no stock valuation account."),
		httpx.Unprocessable(inventory.ErrInputAccount, "Item category has no stock input account."),
		httpx.Unprocessable(inventory.ErrCogsAccount, "Item category has no COGS account."),
	)
}
