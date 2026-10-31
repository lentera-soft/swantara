package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/commission"
	"github.com/jalusw/swantara/apps/service/internal/httpx"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type CommissionPlanResponse struct {
	ID             uint64  `json:"id"`
	OrganizationID *uint64 `json:"organization_id"`
	Name           string  `json:"name"`
	Basis          string  `json:"basis"`
	Active         bool    `json:"active"`
}

func newCommissionPlanResponse(plan *commission.CommissionPlan) CommissionPlanResponse {
	return CommissionPlanResponse{ID: plan.ID, OrganizationID: plan.OrganizationID, Name: plan.Name, Basis: plan.Basis, Active: plan.Active}
}

var commissionPlanQueryAllowlist = map[string]struct{}{
	"organization_id": {},
	"name":            {},
	"basis":           {},
	"active":          {},
	"created_at":      {},
	"updated_at":      {},
}

type ListCommissionPlansResponse struct {
	CommissionPlans []CommissionPlanResponse `json:"commission_plans"`
}

type ListCommissionPlansResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ListCommissionPlansResponse `json:"data"`
}

// @Summary List commission plans
// @Description Lists commission plans with pagination, sorting, and filtering. Results are scoped to the caller's organization.
// @Tags Commissions
// @Accept json
// @Produce json
// @Success 200 {object} ListCommissionPlansResponseEnvelope "Commission plans retrieved successfully."
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/commission-plans [get]
func (h CommissionHandler) ListPlans(c fiber.Ctx) error {
	parsedQuery, err := httpx.ParseQueryParams(c, commissionPlanQueryAllowlist)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid query parameters.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	page, err := h.svc.ListPlansInOrg(c, parsedQuery, organizationID)
	if err != nil {
		httpx.RequestLog(c).Error("commission plan list failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve commission plans.", err)
	}
	items := make([]CommissionPlanResponse, len(page.Items))
	for i, plan := range page.Items {
		items[i] = newCommissionPlanResponse(plan)
	}
	return httpx.CreateSuccessResponseWithMeta(c, "Commission plans retrieved successfully.", ListCommissionPlansResponse{
		CommissionPlans: items,
	}, httpx.BuildListMeta(parsedQuery, page.Count))
}

type GetCommissionPlanResponse struct {
	CommissionPlan CommissionPlanResponse `json:"commission_plan"`
}

type GetCommissionPlanResponseEnvelope struct {
	httpx.EnvelopeBase
	Data GetCommissionPlanResponse `json:"data"`
}

// @Summary Get commission plan
// @Description Gets a single commission plan by id. The plan must belong to the caller's organization; a request for a plan owned by another tenant returns 404.
// @Tags Commissions
// @Accept json
// @Produce json
// @Param id path integer true "Commission plan ID"
// @Success 200 {object} GetCommissionPlanResponseEnvelope "Commission plan retrieved successfully."
// @Failure 404 {object} httpx.ErrorResponse "Commission plan not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/commission-plans/{id} [get]
func (h CommissionHandler) GetPlan(c fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid id.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	plan, err := h.svc.FindPlanInOrg(c, id, organizationID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "Commission plan not found.")
		}
		httpx.RequestLog(c).Error("commission plan get failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve commission plan.", err)
	}
	if plan == nil {
		return httpx.CreateNotFoundResponse(c, "Commission plan not found.")
	}
	return httpx.CreateSuccessResponse(c, "Commission plan retrieved successfully.", GetCommissionPlanResponse{
		CommissionPlan: newCommissionPlanResponse(plan),
	})
}

type CreateCommissionPlanRequest struct {
	OrganizationID *uint64 `json:"organization_id"`
	Name           string  `json:"name" validate:"required"`
	Basis          string  `json:"basis" validate:"required,oneof=revenue margin collected"`
}

type CreateCommissionPlanResponse struct {
	CommissionPlan CommissionPlanResponse `json:"commission_plan"`
}

type CreateCommissionPlanResponseEnvelope struct {
	httpx.EnvelopeBase
	Data CreateCommissionPlanResponse `json:"data"`
}

// @Summary Create commission plan
// @Description Creates a commission plan with a basis (revenue, margin, or collected).
// @Tags Commissions
// @Accept json
// @Produce json
// @Param body body CreateCommissionPlanRequest true "Commission plan details"
// @Success 201 {object} CreateCommissionPlanResponseEnvelope "Commission plan created successfully."
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/commission-plans [post]
func (h CommissionHandler) CreatePlan(c fiber.Ctx) error {
	var request CreateCommissionPlanRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	organizationID := httpx.TenantOrganizationID(c, request.OrganizationID)
	if organizationID == nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Organization ID is required.", nil)
	}
	created, err := h.svc.CreatePlan(c, commission.CreatePlanRequest{
		OrganizationID: *organizationID,
		Name:           request.Name,
		Basis:          request.Basis,
	})
	if err != nil {
		return writeCommissionError(c, err)
	}
	return httpx.CreateCreatedResponse(c, "Commission plan created successfully.", CreateCommissionPlanResponse{
		CommissionPlan: newCommissionPlanResponse(created),
	})
}

type UpdateCommissionPlanRequest struct {
	Active *bool `json:"active"`
}

// @Summary Update commission plan
// @Description Activates or deactivates a commission plan. Inactive plans cannot accrue new entries.
// @Tags Commissions
// @Accept json
// @Produce json
// @Param id path integer true "Commission plan ID"
// @Param body body UpdateCommissionPlanRequest true "Plan update"
// @Success 200 {object} GetCommissionPlanResponseEnvelope "Commission plan updated successfully."
// @Failure 404 {object} httpx.ErrorResponse "Commission plan not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/commission-plans/{id} [put]
func (h CommissionHandler) UpdatePlan(c fiber.Ctx) error {
	var request UpdateCommissionPlanRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid id.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	plan, err := h.svc.FindPlanInOrg(c, id, organizationID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "Commission plan not found.")
		}
		httpx.RequestLog(c).Error("commission plan get failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve commission plan.", err)
	}
	if plan == nil {
		return httpx.CreateNotFoundResponse(c, "Commission plan not found.")
	}
	updated, err := h.svc.UpdatePlan(c, commission.UpdatePlanRequest{PlanID: plan.ID, Active: request.Active})
	if err != nil {
		return writeCommissionError(c, err)
	}
	return httpx.CreateSuccessResponse(c, "Commission plan updated successfully.", GetCommissionPlanResponse{
		CommissionPlan: newCommissionPlanResponse(updated),
	})
}
