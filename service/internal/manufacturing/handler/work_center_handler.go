package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/scope"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type WorkCenterHandler struct {
	centers dao.CRUD[reference.WorkCenter]
}

func NewWorkCenterHandler(centers dao.CRUD[reference.WorkCenter]) WorkCenterHandler {
	return WorkCenterHandler{centers: centers}
}

type WorkCenterResponse struct {
	ID              uint64   `json:"id"`
	OrganizationID  *uint64  `json:"organization_id"`
	Name            string   `json:"name"`
	Code            *string  `json:"code"`
	CostPerHour     *float64 `json:"cost_per_hour"`
	CapacityPerHour *float64 `json:"capacity_per_hour"`
	EfficiencyPct   float64  `json:"efficiency_pct"`
	OeeTarget       *float64 `json:"oee_target"`
}

var workCenterQueryAllowlist = map[string]struct{}{
	"organization_id": {},
	"name":            {},
	"code":            {},
	"created_at":      {},
	"updated_at":      {},
}

func (h WorkCenterHandler) List(c fiber.Ctx) error {
	parsedQuery, err := httpx.ParseQueryParams(c, workCenterQueryAllowlist)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid query parameters.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	page, err := h.centers.List(c, scope.ToOrg(parsedQuery, organizationID))
	if err != nil {
		httpx.RequestLog(c).Error("work center list failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve work centers.", err)
	}

	items := make([]WorkCenterResponse, len(page.Items))
	for i, center := range page.Items {
		items[i] = WorkCenterResponse{
			ID:              center.ID,
			OrganizationID:  center.OrganizationID,
			Name:            center.Name,
			Code:            center.Code,
			CostPerHour:     center.CostPerHour,
			CapacityPerHour: center.CapacityPerHour,
			EfficiencyPct:   center.EfficiencyPct,
			OeeTarget:       center.OeeTarget,
		}
	}

	return httpx.CreateSuccessResponseWithMeta(c, "Work centers retrieved successfully.", struct {
		WorkCenters []WorkCenterResponse `json:"work_centers"`
	}{WorkCenters: items}, httpx.BuildListMeta(parsedQuery, page.Count))
}
