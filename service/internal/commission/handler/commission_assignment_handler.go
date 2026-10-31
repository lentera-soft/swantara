package handler

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/commission"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type CommissionAssignmentResponse struct {
	ID            uint64     `json:"id"`
	PlanID        uint64     `json:"plan_id"`
	SalespersonID uint64     `json:"salesperson_id"`
	DateStart     *time.Time `json:"date_start"`
	DateEnd       *time.Time `json:"date_end"`
}

func newCommissionAssignmentResponse(a *commission.CommissionAssignment) CommissionAssignmentResponse {
	return CommissionAssignmentResponse{ID: a.ID, PlanID: a.PlanID, SalespersonID: a.SalespersonID, DateStart: a.DateStart, DateEnd: a.DateEnd}
}

type ListCommissionAssignmentsResponse struct {
	CommissionAssignments []CommissionAssignmentResponse `json:"commission_assignments"`
}

type ListCommissionAssignmentsResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ListCommissionAssignmentsResponse `json:"data"`
}

// @Summary List commission assignments
// @Description Lists the salesperson assignments of a commission plan. The plan must belong to the caller's organization.
// @Tags Commissions
// @Accept json
// @Produce json
// @Param id path integer true "Commission plan ID"
// @Success 200 {object} ListCommissionAssignmentsResponseEnvelope "Commission assignments retrieved successfully."
// @Failure 404 {object} httpx.ErrorResponse "Commission plan not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/commission-plans/{id}/assignments [get]
func (h CommissionHandler) ListAssignments(c fiber.Ctx) error {
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
	assigns, err := h.svc.ListAssignments(c, &query.Query{Filters: []query.Filter{{Field: "plan_id", Operator: query.Equal, Value: plan.ID}}})
	if err != nil {
		httpx.RequestLog(c).Error("commission assignments list failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve commission assignments.", err)
	}
	items := make([]CommissionAssignmentResponse, len(assigns.Items))
	for i, a := range assigns.Items {
		items[i] = newCommissionAssignmentResponse(a)
	}
	return httpx.CreateSuccessResponse(c, "Commission assignments retrieved successfully.", ListCommissionAssignmentsResponse{
		CommissionAssignments: items,
	})
}

type CreateCommissionAssignmentRequest struct {
	SalespersonID uint64  `json:"salesperson_id" validate:"required,gt=0"`
	DateStart     string  `json:"date_start" validate:"required"`
	DateEnd       *string `json:"date_end"`
}

type CreateCommissionAssignmentResponse struct {
	CommissionAssignment CommissionAssignmentResponse `json:"commission_assignment"`
}

type CreateCommissionAssignmentResponseEnvelope struct {
	httpx.EnvelopeBase
	Data CreateCommissionAssignmentResponse `json:"data"`
}

// @Summary Assign salesperson to plan
// @Description Assigns a salesperson to a commission plan for a period, rejecting overlapping assignments for the same salesperson.
// @Tags Commissions
// @Accept json
// @Produce json
// @Param id path integer true "Commission plan ID"
// @Param body body CreateCommissionAssignmentRequest true "Assignment details"
// @Success 201 {object} CreateCommissionAssignmentResponseEnvelope "Commission assignment created successfully."
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/commission-plans/{id}/assignments [post]
func (h CommissionHandler) CreateAssignment(c fiber.Ctx) error {
	var request CreateCommissionAssignmentRequest
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
	start, err := helper.ParseDateStr(request.DateStart)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid date_start.", nil)
	}
	var end *time.Time
	if request.DateEnd != nil {
		parsed, err := helper.ParseDateStr(*request.DateEnd)
		if err != nil {
			return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid date_end.", nil)
		}
		end = &parsed
	}
	created, err := h.svc.Assign(c, commission.AssignRequest{
		PlanID:        plan.ID,
		SalespersonID: request.SalespersonID,
		DateStart:     start,
		DateEnd:       end,
	})
	if err != nil {
		return writeCommissionError(c, err)
	}
	return httpx.CreateCreatedResponse(c, "Commission assignment created successfully.", CreateCommissionAssignmentResponse{
		CommissionAssignment: newCommissionAssignmentResponse(created),
	})
}
