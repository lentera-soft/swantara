package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/procurement"
)

func (h PurchaseRequestHandler) ensureRequisitionInOrg(c fiber.Ctx, requestID uint64) error {
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	requisition, err := h.svc.FindInOrg(c, requestID, organizationID)
	if err != nil {
		return writeRequisitionError(c, err)
	}
	if requisition == nil {
		return httpx.CreateNotFoundResponse(c, "Purchase requisition not found.")
	}
	return nil
}

// @Summary Confirm purchase requisition
// @Description Confirms a purchase requisition, transitioning it from draft to confirmed. The state machine rejects the transition from any other state, so only draft requisitions can be confirmed.
// @Tags Purchase Requisitions
// @Accept json
// @Produce json
// @Param id path integer true "Purchase requisition ID"
// @Success 200 {object} GetPurchaseRequestResponseEnvelope "Purchase requisition confirmed successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Purchase requisition not found"
// @Failure 409 {object} httpx.ErrorResponse "Conflict"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/purchase-requests/{id}/confirm [post]
func (h PurchaseRequestHandler) Confirm(c fiber.Ctx) error {
	requestID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid purchase requisition id provided.", nil)
	}
	if err := h.ensureRequisitionInOrg(c, requestID); err != nil {
		return err
	}
	requisition, err := h.svc.Confirm(c, requestID)
	if err != nil {
		return writeRequisitionError(c, err)
	}
	return httpx.CreateSuccessResponse(c, "Purchase requisition confirmed successfully.", GetPurchaseRequestResponse{
		Request: newPurchaseRequestResponse(requisition),
	})
}

// @Summary Approve purchase requisition
// @Description Approves a confirmed purchase requisition, moving it to the approved state from which it can be converted into a purchase order or purchase QuoteRequest. The state machine rejects the transition from any state other than confirmed.
// @Tags Purchase Requisitions
// @Accept json
// @Produce json
// @Param id path integer true "Purchase requisition ID"
// @Success 200 {object} GetPurchaseRequestResponseEnvelope "Purchase requisition approved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Purchase requisition not found"
// @Failure 409 {object} httpx.ErrorResponse "Conflict"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/purchase-requests/{id}/approve [post]
func (h PurchaseRequestHandler) Approve(c fiber.Ctx) error {
	requestID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid purchase requisition id provided.", nil)
	}
	if err := h.ensureRequisitionInOrg(c, requestID); err != nil {
		return err
	}
	requisition, err := h.svc.Approve(c, requestID)
	if err != nil {
		return writeRequisitionError(c, err)
	}
	return httpx.CreateSuccessResponse(c, "Purchase requisition approved successfully.", GetPurchaseRequestResponse{
		Request: newPurchaseRequestResponse(requisition),
	})
}

// @Summary Cancel purchase requisition
// @Description Cancels a purchase requisition that is in draft or confirmed state, moving it to cancelled before it is approved. The state machine rejects cancellation from any other state.
// @Tags Purchase Requisitions
// @Accept json
// @Produce json
// @Param id path integer true "Purchase requisition ID"
// @Success 200 {object} GetPurchaseRequestResponseEnvelope "Purchase requisition cancelled successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Purchase requisition not found"
// @Failure 409 {object} httpx.ErrorResponse "Conflict"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/purchase-requests/{id}/cancel [post]
func (h PurchaseRequestHandler) Cancel(c fiber.Ctx) error {
	requestID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid purchase requisition id provided.", nil)
	}
	if err := h.ensureRequisitionInOrg(c, requestID); err != nil {
		return err
	}
	requisition, err := h.svc.Cancel(c, requestID)
	if err != nil {
		return writeRequisitionError(c, err)
	}
	return httpx.CreateSuccessResponse(c, "Purchase requisition cancelled successfully.", GetPurchaseRequestResponse{
		Request: newPurchaseRequestResponse(requisition),
	})
}

func writeRequisitionError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "purchase requisition write failed", "Failed to process purchase requisition.",
		httpx.NotFound(procurement.ErrRequisitionNotFound, "Purchase requisition not found."),
		httpx.Conflict(procurement.ErrRequestState, "Purchase requisition cannot be processed in its current state."),
		httpx.Unprocessable(procurement.ErrRequisitionNoLines, "Purchase requisition must have at least one line."),
		httpx.Unprocessable(procurement.ErrRequisitionLineQty, "Purchase requisition line quantity must be positive."),
		httpx.Unprocessable(procurement.ErrRequisitionRequester, "Purchase requisition requester does not exist."),
	)
}
