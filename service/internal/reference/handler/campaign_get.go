package handler

import (
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"

	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type GetCampaignResponseEnvelope struct {
	httpx.EnvelopeBase
	Data GetCampaignResponse `json:"data"`
}
type GetCampaignResponse struct {
	Campaign CampaignResponse `json:"campaign"`
}

// @Summary Get campaign
// @Description Gets a single campaign by id. The campaign must belong to the caller's organization, otherwise a 404 is returned.
// @Tags Campaigns
// @Accept json
// @Produce json
// @Param id path int true "Campaign ID"
// @Success 200 {object} GetCampaignResponseEnvelope "Campaign retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Campaign not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/campaigns/{id} [get]
func (h CampaignHandler) Get(c fiber.Ctx) error {
	campaignID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid campaign id provided.", nil)
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	campaign, err := h.svc.FindInOrg(c, campaignID, organizationID)
	if err != nil {
		if dao.IsNotFound(err) || errors.Is(err, reference.ErrCampaignNotFound) {
			return httpx.CreateNotFoundResponse(c, "Campaign not found.")
		}
		httpx.RequestLog(c).Error("campaign lookup failed", "campaign_id", campaignID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to get campaign.", err)
	}
	if campaign == nil {
		return httpx.CreateNotFoundResponse(c, "Campaign not found.")
	}

	return httpx.CreateSuccessResponse(c, "Campaign retrieved successfully.", GetCampaignResponse{
		Campaign: newCampaignResponse(campaign),
	})
}
