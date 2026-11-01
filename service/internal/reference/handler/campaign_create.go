package handler

import (
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type CreateCampaignRequest struct {
	OrganizationID *uint64    `json:"organization_id"`
	Code           *string    `json:"code"`
	Name           string     `json:"name" validate:"required"`
	Description    *string    `json:"description"`
	Channel        *string    `json:"channel"`
	Status         string     `json:"status"`
	StartDate      *time.Time `json:"start_date"`
	EndDate        *time.Time `json:"end_date"`
	Budget         *float64   `json:"budget"`
}

type CreateCampaignResponseEnvelope struct {
	httpx.EnvelopeBase
	Data CreateCampaignResponse `json:"data"`
}
type CreateCampaignResponse struct {
	Campaign CampaignResponse `json:"campaign"`
}

// @Summary Create campaign
// @Description Creates a new campaign within the caller's organization.
// @Tags Campaigns
// @Accept json
// @Produce json
// @Param body body CreateCampaignRequest true "Campaign payload"
// @Success 201 {object} CreateCampaignResponseEnvelope "Campaign created successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/campaigns [post]
func (h CampaignHandler) Create(c fiber.Ctx) error {
	var request CreateCampaignRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}

	organizationID := httpx.TenantOrganizationID(c, request.OrganizationID)
	if organizationID == nil {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	campaign, err := h.svc.Create(c, &reference.Campaign{
		OrganizationID: organizationID,
		Code:           request.Code,
		Name:           request.Name,
		Description:    request.Description,
		Channel:        request.Channel,
		Status:         request.Status,
		StartDate:      request.StartDate,
		EndDate:        request.EndDate,
		Budget:         request.Budget,
	})
	if err != nil {
		return writeCampaignError(c, err)
	}

	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateCreatedResponse(c, "Campaign created successfully.", CreateCampaignResponse{
		Campaign: newCampaignResponse(campaign),
	})
}
