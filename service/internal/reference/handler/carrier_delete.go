package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

// @Summary Delete carrier
// @Description Deletes a carrier. The carrier must belong to the caller's organization, otherwise a 404 is returned.
// @Tags Carriers
// @Accept json
// @Produce json
// @Param id path int true "Carrier ID"
// @Success 204 "No content"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Carrier not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/carriers/{id} [delete]
func (h CarrierHandler) Delete(c fiber.Ctx) error {
	carrierID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid carrier id provided.", nil)
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	if err := h.svc.Delete(c, organizationID, carrierID); err != nil {
		return writeCarrierError(c, err)
	}

	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateNoContentResponse(c)
}
