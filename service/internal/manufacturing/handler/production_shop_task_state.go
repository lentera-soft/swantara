package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

// @Summary Confirm shop task
// @Description Confirms a planned shop task, transitioning it to the confirmed state. Only planned tasks of a planned or in-progress production order can be confirmed; any other state is rejected with a conflict.
// @Tags Work Orders
// @Accept json
// @Produce json
// @Param id path integer true "Production order ID"
// @Param shop_task_id path integer true "Shop task ID"
// @Success 200 {object} GetShopTaskResponseEnvelope "Shop task confirmed successfully."
// @Failure 400 {object} httpx.ErrorResponse "Bad request"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Shop task not found"
// @Failure 409 {object} httpx.ErrorResponse "State transition not allowed"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/production-orders/{id}/shop-tasks/{shop_task_id}/confirm [post]
func (h ProductionHandler) ConfirmShopTask(c fiber.Ctx) error {
	productionOrderID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid production order id provided.", nil)
	}
	shopTaskID, err := strconv.ParseUint(c.Params("shop_task_id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid shop task id provided.", nil)
	}

	allowed, err := h.ensureProductionOrderInOrg(c, productionOrderID)
	if err != nil {
		return err
	}
	if !allowed {
		return nil
	}

	workOrder, err := h.svc.ConfirmShopTask(c, productionOrderID, shopTaskID)
	if err != nil {
		return writeProductionError(c, err)
	}

	return httpx.CreateSuccessResponse(c, "Shop task confirmed successfully.", GetShopTaskResponse{
		ShopTask: newShopTaskResponse(workOrder),
	})
}

// @Summary Start shop task
// @Description Starts a confirmed shop task, transitioning it to the in_progress state and stamping the actual start date. Only confirmed tasks of an in-progress production order can be started; any other state is rejected with a conflict.
// @Tags Work Orders
// @Accept json
// @Produce json
// @Param id path integer true "Production order ID"
// @Param shop_task_id path integer true "Shop task ID"
// @Success 200 {object} GetShopTaskResponseEnvelope "Shop task started successfully."
// @Failure 400 {object} httpx.ErrorResponse "Bad request"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Shop task not found"
// @Failure 409 {object} httpx.ErrorResponse "State transition not allowed"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/production-orders/{id}/shop-tasks/{shop_task_id}/start [post]
func (h ProductionHandler) StartShopTask(c fiber.Ctx) error {
	productionOrderID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid production order id provided.", nil)
	}
	shopTaskID, err := strconv.ParseUint(c.Params("shop_task_id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid shop task id provided.", nil)
	}

	allowed, err := h.ensureProductionOrderInOrg(c, productionOrderID)
	if err != nil {
		return err
	}
	if !allowed {
		return nil
	}

	workOrder, err := h.svc.StartShopTask(c, productionOrderID, shopTaskID)
	if err != nil {
		return writeProductionError(c, err)
	}

	return httpx.CreateSuccessResponse(c, "Shop task started successfully.", GetShopTaskResponse{
		ShopTask: newShopTaskResponse(workOrder),
	})
}
