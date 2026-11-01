package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/inventory"
)

func writeShipmentError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "stock shipment write failed", "Failed to process stock shipment.",
		httpx.NotFound(inventory.ErrShipmentNotFound, "Stock shipment not found."),
		httpx.Conflict(inventory.ErrShipmentState, "Stock shipment cannot transition in its current state."),
	)
}

func (h StockHandler) shipmentAction(c fiber.Ctx, action func(id, organizationID uint64) (*inventory.Shipment, error)) error {
	shipmentID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid stock shipment id provided.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	shipment, err := action(shipmentID, organizationID)
	if err != nil {
		return writeShipmentError(c, err)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "Stock shipment updated successfully.", GetShipmentResponse{
		Shipment: newShipmentResponse(shipment),
	})
}

// @Summary Validate stock shipment
// @Description Confirms a draft or waiting stock shipment, transitioning it to the confirmed state. Any other state is rejected with a conflict.
// @Tags Stock Shipments
// @Accept json
// @Produce json
// @Param id path integer true "Stock shipment ID"
// @Success 200 {object} GetShipmentResponseEnvelope "Stock shipment confirmed successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Stock shipment not found"
// @Failure 409 {object} httpx.ErrorResponse "State transition not allowed"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/shipments/{id}/confirm [post]
func (h StockHandler) ConfirmShipment(c fiber.Ctx) error {
	return h.shipmentAction(c, func(id, organizationID uint64) (*inventory.Shipment, error) {
		return h.stock.ConfirmShipment(c, id, organizationID)
	})
}

// @Summary Complete stock shipment
// @Description Marks a confirmed or assigned stock shipment as done and stamps the completion date. Any other state is rejected with a conflict.
// @Tags Stock Shipments
// @Accept json
// @Produce json
// @Param id path integer true "Stock shipment ID"
// @Success 200 {object} GetShipmentResponseEnvelope "Stock shipment completed successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Stock shipment not found"
// @Failure 409 {object} httpx.ErrorResponse "State transition not allowed"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/shipments/{id}/done [post]
func (h StockHandler) CompleteShipment(c fiber.Ctx) error {
	return h.shipmentAction(c, func(id, organizationID uint64) (*inventory.Shipment, error) {
		return h.stock.CompleteShipment(c, id, organizationID)
	})
}

// @Summary Cancel stock shipment
// @Description Cancels a stock shipment that is not already done or cancelled. Any other state is rejected with a conflict.
// @Tags Stock Shipments
// @Accept json
// @Produce json
// @Param id path integer true "Stock shipment ID"
// @Success 200 {object} GetShipmentResponseEnvelope "Stock shipment cancelled successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Stock shipment not found"
// @Failure 409 {object} httpx.ErrorResponse "State transition not allowed"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/shipments/{id}/cancel [post]
func (h StockHandler) CancelShipment(c fiber.Ctx) error {
	return h.shipmentAction(c, func(id, organizationID uint64) (*inventory.Shipment, error) {
		return h.stock.CancelShipment(c, id, organizationID)
	})
}
