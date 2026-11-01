package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/manufacturing"
)

func (h PlanningHandler) ensurePlannedOrderInOrg(c fiber.Ctx, plannedOrderID uint64) error {
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	order, err := h.svc.FindPlannedInOrg(c, plannedOrderID, organizationID)
	if err != nil {
		return writeMrpError(c, err)
	}
	if order == nil {
		return httpx.CreateNotFoundResponse(c, "Planning run or planned order not found.")
	}
	return nil
}

// @Summary Confirm Planning planned order
// @Description Confirms a Planning planned order, generating the underlying purchase order or production order based on its type. Purchase planned orders require a supplier and price their line at the item's standard cost, while manufacture planned orders require an active manufacture recipe and create and confirm the production order. The planned order is marked confirmed with a reference to the generated document.
// @Tags Planning
// @Accept json
// @Produce json
// @Param id path integer true "Planned order ID"
// @Param body body ConfirmPlannedRequest true "Confirmation details"
// @Success 200 {object} PlannedSupplyResponseEnvelope "Planned order confirmed successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 409 {object} httpx.ErrorResponse "Planned order already confirmed"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/planning/planned-orders/{id}/confirm [post]
func (h PlanningHandler) Confirm(c fiber.Ctx) error {
	plannedOrderID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid planned order id.", nil)
	}
	var request ConfirmPlannedRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	if err := h.ensurePlannedOrderInOrg(c, plannedOrderID); err != nil {
		return err
	}
	order, err := h.svc.Confirm(c, plannedOrderID, request.SupplierID)
	if err != nil {
		return writeMrpError(c, err)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "Planned order confirmed successfully.", PlannedSupplyResponse{
		ID:               order.ID,
		PlanningRunID:    order.PlanningRunID,
		ItemID:           order.ItemID,
		WarehouseID:      order.WarehouseID,
		Type:             order.Type,
		Qty:              order.Qty,
		OrderDate:        order.OrderDate,
		DueDate:          order.DueDate,
		PeggedDemandID:   order.PeggedDemandID,
		Confirmed:        order.Confirmed,
		GeneratedDocType: order.GeneratedDocType,
		GeneratedDocID:   order.GeneratedDocID,
		CreatedAt:        order.CreatedAt,
		UpdatedAt:        order.UpdatedAt,
	})
}

func writeMrpError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "planning write failed", "Failed to process Planning operation.",
		httpx.Unprocessable(manufacturing.ErrPlanningRunNotRequired, "Planning run horizon must be greater than zero."),
		httpx.Unprocessable(manufacturing.ErrPlanningItem, "Planning item variant does not exist."),
		httpx.Unprocessable(manufacturing.ErrPlanningNoRecipe, "Planning manufacture planned order requires a recipe."),
		httpx.Unprocessable(manufacturing.ErrPlanningPlannedType, "Planning planned order type is not supported."),
		httpx.Conflict(manufacturing.ErrPlanningPlannedState, "Planning planned order is already confirmed."),
		httpx.Unprocessable(manufacturing.ErrPlanningSupplier, "Planning purchase planned order requires a supplier."),
		httpx.Unprocessable(manufacturing.ErrProductionOrderOrganization, "Production order requires an organization."),
		httpx.Unprocessable(manufacturing.ErrProductionOrderLocation, "Production order location does not exist."),
		httpx.Unprocessable(manufacturing.ErrProductionLocation, "Production location does not exist."),
		httpx.NotFound(manufacturing.ErrProductionOrderNotFound, "Planning run or planned order not found."),
	)
}
