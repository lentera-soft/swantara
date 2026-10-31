package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/manufacturing"
)

func writeSubcontractError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "outside processing order write failed", "Failed to process outside processing order.",
		httpx.NotFound(manufacturing.ErrOutsideProcessingNotFound, "Outside processing order not found."),
		httpx.Conflict(manufacturing.ErrOutsideProcessingDuplicate, "Outside processing order already exists for this production order."),
		httpx.Conflict(manufacturing.ErrOutsideProcessingState, "State does not allow this operation."),
		httpx.Conflict(manufacturing.ErrOutsideProcessingOrderState, "State does not allow this operation."),
		httpx.NotFound(manufacturing.ErrProductionOrderNotFound, "Production order not found."),
		httpx.Unprocessable(manufacturing.ErrProductionOrderRecipe, "Production order recipe is missing."),
		httpx.Unprocessable(manufacturing.ErrOutsideProcessingNotSubcontracted, "Production order recipe is not a subcontract recipe."),
		httpx.Unprocessable(manufacturing.ErrOutsideProcessingComponents, "Outside processing order has no components to send."),
		httpx.Unprocessable(manufacturing.ErrOutsideProcessingSupplierLocation, "Supplier location does not exist."),
		httpx.Unprocessable(manufacturing.ErrOutsideProcessingOperation, "Subcontract operation amount could not be determined."),
		httpx.Unprocessable(manufacturing.ErrOutsideProcessingPurchaseOrder, "Subcontract purchase order is missing."),
		httpx.Unprocessable(manufacturing.ErrOutsideProcessingSupplier, "Outside processing order requires an active supplier supplier."),
		httpx.Unprocessable(manufacturing.ErrWIPAccount, "Work in progress account is required."),
	)
}
