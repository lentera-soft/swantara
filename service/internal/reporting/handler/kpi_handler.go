package handler

import (
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/reporting"

	"github.com/jalusw/swantara/apps/service/internal/kernel/clock"
)

type KpiHandler struct {
	svc        reporting.KpiService
	leadToCash *reporting.LeadToCashService
}

func NewKpiHandler(svc reporting.KpiService) KpiHandler {
	return KpiHandler{svc: svc}
}

func (h KpiHandler) WithLeadToCash(svc reporting.LeadToCashService) KpiHandler {
	h.leadToCash = &svc
	return h
}

func parseDateRange(c fiber.Ctx) (time.Time, time.Time, bool) {
	now := clock.Now().UTC()
	start := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	end := now
	if raw := c.Query("start"); raw != "" {
		parsed, err := helper.ParseDate(&raw)
		if err != nil {
			return time.Time{}, time.Time{}, false
		}
		start = *parsed
	}
	if raw := c.Query("end"); raw != "" {
		parsed, err := helper.ParseDate(&raw)
		if err != nil {
			return time.Time{}, time.Time{}, false
		}
		end = parsed.Add(24*time.Hour - time.Nanosecond)
	}
	if start.After(end) {
		return time.Time{}, time.Time{}, false
	}
	return start, end, true
}

func organizationOf(c fiber.Ctx) (*uint64, error) {
	organizationID := httpx.TenantOrganizationID(c, nil)
	if organizationID == nil {
		return nil, httpx.ErrMissingOrganizationInContext
	}
	return organizationID, nil
}

func writeKpiError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "request failed", "Failed to process request.")
}

// @Summary Lead-to-cash KPI
// @Description Returns the lead-to-cash funnel, cycle times, and win-rate/cash-conversion segments by source, owner, and sales group.
// @Tags KPIs
// @Accept json
// @Produce json
// @Param start query string false "Start date (YYYY-MM-DD)"
// @Param end query string false "End date (YYYY-MM-DD)"
// @Success 200 {object} reporting.LeadToCashReport "Lead-to-cash report retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/kpis/lead-to-cash [get]
func (h KpiHandler) LeadToCash(c fiber.Ctx) error {
	organizationID, err := organizationOf(c)
	if err != nil {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	start, end, ok := parseDateRange(c)
	if !ok {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Dates must be valid, in YYYY-MM-DD format, and start must not be after end.", nil)
	}
	if h.leadToCash == nil {
		return httpx.CreateInternalServerErrorResponse(c, "Lead-to-cash reporting is not configured.", nil)
	}
	report, err := h.leadToCash.Report(c, *organizationID, start, end)
	if err != nil {
		return writeKpiError(c, err)
	}
	return httpx.CreateSuccessResponse(c, "Lead-to-cash report retrieved successfully.", report)
}
