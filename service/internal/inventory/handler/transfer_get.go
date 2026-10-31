package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

// @Summary Get warehouse transfer
// @Description Gets a single warehouse transfer by its id, including its state, source and destination warehouses, linked shipments, and scheduling details. The order is looked up and returned only when it belongs to the caller's organization; otherwise the request is answered with 404 Not Found to avoid leaking the record's existence.
// @Tags Transfer Orders
// @Accept json
// @Produce json
// @Param id path integer true "Warehouse transfer ID"
// @Success 200 {object} GetWarehouseTransferResponseEnvelope "Warehouse transfer retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Warehouse transfer not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/warehouse-transfers/{id} [get]
func (h TransferHandler) Get(c fiber.Ctx) error {
	transferID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid warehouse transfer id provided.", nil)
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	transfer, err := h.svc.FindInOrg(c, transferID, organizationID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "Warehouse transfer not found.")
		}
		httpx.RequestLog(c).Error("warehouse transfer lookup failed", "transfer_id", transferID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to get warehouse transfer.", err)
	}
	if transfer == nil {
		return httpx.CreateNotFoundResponse(c, "Warehouse transfer not found.")
	}

	return httpx.CreateSuccessResponse(c, "Warehouse transfer retrieved successfully.", GetWarehouseTransferResponse{
		WarehouseTransfer: newWarehouseTransferResponse(transfer),
	})
}
