package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

// @Summary Delete campaign
// @Description Deletes a campaign. The campaign must belong to the caller's organization, otherwise a 404 is returned.
// @Tags Campaigns
// @Accept json
// @Produce json
// @Param id path int true "Campaign ID"
// @Success 204 "No content"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Campaign not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/campaigns/{id} [delete]
func (h CampaignHandler) Delete(c fiber.Ctx) error {
	campaignID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid campaign id provided.", nil)
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	if err := h.svc.Delete(c, organizationID, campaignID); err != nil {
		return writeCampaignError(c, err)
	}

	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateNoContentResponse(c)
}
