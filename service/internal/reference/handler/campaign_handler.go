package handler

import (
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type CampaignHandler struct {
	svc reference.CampaignService
}

func NewCampaignHandler(svc reference.CampaignService) CampaignHandler {
	return CampaignHandler{svc: svc}
}

type CampaignResponse struct {
	ID             uint64     `json:"id"`
	OrganizationID *uint64    `json:"organization_id"`
	Code           *string    `json:"code"`
	Name           string     `json:"name"`
	Description    *string    `json:"description"`
	Channel        *string    `json:"channel"`
	Status         string     `json:"status"`
	StartDate      *time.Time `json:"start_date"`
	EndDate        *time.Time `json:"end_date"`
	Budget         *float64   `json:"budget"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

func newCampaignResponse(campaign *reference.Campaign) CampaignResponse {
	return CampaignResponse{
		ID:             campaign.ID,
		OrganizationID: campaign.OrganizationID,
		Code:           campaign.Code,
		Name:           campaign.Name,
		Description:    campaign.Description,
		Channel:        campaign.Channel,
		Status:         campaign.Status,
		StartDate:      campaign.StartDate,
		EndDate:        campaign.EndDate,
		Budget:         campaign.Budget,
		CreatedAt:      campaign.CreatedAt,
		UpdatedAt:      campaign.UpdatedAt,
	}
}

var campaignQueryAllowlist = map[string]struct{}{
	"organization_id": {},
	"code":            {},
	"name":            {},
	"channel":         {},
	"status":          {},
	"start_date":      {},
	"end_date":        {},
	"budget":          {},
	"created_at":      {},
	"updated_at":      {},
}

func writeCampaignError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "campaign write failed", "Failed to save campaign.",
		httpx.NotFound(reference.ErrCampaignNotFound, "Campaign not found."),
		httpx.Unprocessable(reference.ErrCampaignName, "Campaign name is required."),
	)
}
