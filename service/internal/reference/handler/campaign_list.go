package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

type ListCampaignsResponse struct {
	Campaigns []CampaignResponse `json:"campaigns"`
}

type ListCampaignsResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ListCampaignsResponse `json:"data"`
}

// @Summary List campaigns
// @Description Lists campaign records scoped to the caller's organization.
// @Tags Campaigns
// @Accept json
// @Produce json
// @Param page query int false "Page number"
// @Param size query int false "Page size"
// @Param sort query string false "Sort fields (e.g. name:asc)"
// @Success 200 {object} ListCampaignsResponseEnvelope "Campaigns retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 422 {object} httpx.ErrorResponse "Invalid query parameters"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/campaigns [get]
func (h CampaignHandler) List(c fiber.Ctx) error {
	parsedQuery, err := httpx.ParseQueryParams(c, campaignQueryAllowlist)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid query parameters.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	page, err := h.svc.ListInOrg(c, parsedQuery, organizationID)
	if err != nil {
		httpx.RequestLog(c).Error("campaign list failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve campaigns.", err)
	}

	items := make([]CampaignResponse, len(page.Items))
	for i, campaign := range page.Items {
		items[i] = newCampaignResponse(campaign)
	}

	if httpx.RequestFormat(c) == httpx.FormatCSV {
		return httpx.ExportCSV(c, fiber.StatusOK, "campaigns.csv", items)
	}

	return httpx.CreateSuccessResponseWithMeta(c, "Campaigns retrieved successfully.", ListCampaignsResponse{
		Campaigns: items,
	}, httpx.BuildListMeta(parsedQuery, page.Count))
}
