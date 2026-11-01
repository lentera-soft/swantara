package handler

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type UpdateCampaignRequest struct {
	Code        *string    `json:"code"`
	Name        string     `json:"name" validate:"required"`
	Description *string    `json:"description"`
	Channel     *string    `json:"channel"`
	Status      string     `json:"status"`
	StartDate   *time.Time `json:"start_date"`
	EndDate     *time.Time `json:"end_date"`
	Budget      *float64   `json:"budget"`
}

type UpdateCampaignResponseEnvelope struct {
	httpx.EnvelopeBase
	Data UpdateCampaignResponse `json:"data"`
}
type UpdateCampaignResponse struct {
	Campaign CampaignResponse `json:"campaign"`
}

// @Summary Update campaign
// @Description Updates an existing campaign. The campaign must belong to the caller's organization, otherwise a 404 is returned.
// @Tags Campaigns
// @Accept json
// @Produce json
// @Param id path int true "Campaign ID"
// @Param body body UpdateCampaignRequest true "Campaign payload"
// @Success 200 {object} UpdateCampaignResponseEnvelope "Campaign updated successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Campaign not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/campaigns/{id} [put]
func (h CampaignHandler) Update(c fiber.Ctx) error {
	campaignID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid campaign id provided.", nil)
	}

	var request UpdateCampaignRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	campaign := &reference.Campaign{
		Base:        model.Base{ID: campaignID},
		Code:        request.Code,
		Name:        request.Name,
		Description: request.Description,
		Channel:     request.Channel,
		Status:      request.Status,
		StartDate:   request.StartDate,
		EndDate:     request.EndDate,
		Budget:      request.Budget,
	}

	updated, err := h.svc.Update(c, organizationID, campaign)
	if err != nil {
		return writeCampaignError(c, err)
	}

	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "Campaign updated successfully.", UpdateCampaignResponse{
		Campaign: newCampaignResponse(updated),
	})
}
