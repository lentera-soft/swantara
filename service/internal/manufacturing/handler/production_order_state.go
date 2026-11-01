package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

func (h ProductionOrderHandler) ensureInOrg(c fiber.Ctx, productionOrderID uint64) (bool, error) {
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return false, httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	order, err := h.svc.FindInOrg(c, productionOrderID, organizationID)
	if err != nil {
		return false, writeProductionOrderError(c, err)
	}
	if order == nil {
		return false, httpx.CreateNotFoundResponse(c, "Production order not found.")
	}
	return true, nil
}

// @Summary Confirm production order
// @Description Confirms a production order, transitioning it from draft to confirmed. Only draft orders can be confirmed; any other state is rejected with a conflict.
// @Tags Manufacturing Orders
// @Accept json
// @Produce json
// @Param id path integer true "Production order ID"
// @Success 200 {object} GetProductionOrderResponseEnvelope "Production order confirmed successfully."
// @Failure 400 {object} httpx.ErrorResponse "Bad request"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Production order not found"
// @Failure 409 {object} httpx.ErrorResponse "State transition not allowed"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/production-orders/{id}/confirm [post]
func (h ProductionOrderHandler) Confirm(c fiber.Ctx) error {
	productionOrderID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid production order id provided.", nil)
	}

	allowed, err := h.ensureInOrg(c, productionOrderID)
	if err != nil {
		return err
	}
	if !allowed {
		return nil
	}
	productionOrder, err := h.svc.Confirm(c, productionOrderID)
	if err != nil {
		return writeProductionOrderError(c, err)
	}

	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "Production order confirmed successfully.", GetProductionOrderResponse{
		ProductionOrder: newProductionOrderResponse(productionOrder),
	})
}

// @Summary Plan production order
// @Description Plans a confirmed production order by reserving the planned component quantities from the source location through stock reservations, then transitioning the order to the planned state. The operation fails with a conflict when there is insufficient stock to reserve the components.
// @Tags Manufacturing Orders
// @Accept json
// @Produce json
// @Param id path integer true "Production order ID"
// @Success 200 {object} GetProductionOrderResponseEnvelope "Production order planned successfully."
// @Failure 400 {object} httpx.ErrorResponse "Bad request"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Production order not found"
// @Failure 409 {object} httpx.ErrorResponse "State transition not allowed or insufficient stock"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/production-orders/{id}/plan [post]
func (h ProductionOrderHandler) Plan(c fiber.Ctx) error {
	productionOrderID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid production order id provided.", nil)
	}

	allowed, err := h.ensureInOrg(c, productionOrderID)
	if err != nil {
		return err
	}
	if !allowed {
		return nil
	}

	productionOrder, err := h.svc.Plan(c, productionOrderID)
	if err != nil {
		return writeProductionOrderError(c, err)
	}

	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "Production order planned successfully.", GetProductionOrderResponse{
		ProductionOrder: newProductionOrderResponse(productionOrder),
	})
}

// @Summary Cancel production order
// @Description Cancels a production order, moving it to the cancelled state. The transition is rejected when the order is already done or already cancelled, so only orders that have not been completed can be cancelled.
// @Tags Manufacturing Orders
// @Accept json
// @Produce json
// @Param id path integer true "Production order ID"
// @Success 200 {object} GetProductionOrderResponseEnvelope "Production order cancelled successfully."
// @Failure 400 {object} httpx.ErrorResponse "Bad request"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Production order not found"
// @Failure 409 {object} httpx.ErrorResponse "State transition not allowed"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/production-orders/{id}/cancel [post]
func (h ProductionOrderHandler) Cancel(c fiber.Ctx) error {
	productionOrderID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid production order id provided.", nil)
	}

	allowed, err := h.ensureInOrg(c, productionOrderID)
	if err != nil {
		return err
	}
	if !allowed {
		return nil
	}
	productionOrder, err := h.svc.Cancel(c, productionOrderID)
	if err != nil {
		return writeProductionOrderError(c, err)
	}

	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "Production order cancelled successfully.", GetProductionOrderResponse{
		ProductionOrder: newProductionOrderResponse(productionOrder),
	})
}
