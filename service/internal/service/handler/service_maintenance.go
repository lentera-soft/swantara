package handler

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/service"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type MaintenancePlanResponse struct {
	ID           uint64     `json:"id"`
	EquipmentID  *uint64    `json:"equipment_id"`
	Name         string     `json:"name"`
	IntervalDays int        `json:"interval_days"`
	NextDue      *time.Time `json:"next_due"`
	Active       bool       `json:"active"`
}

func newMaintenancePlanResponse(plan *service.MaintenancePlan) MaintenancePlanResponse {
	return MaintenancePlanResponse{
		ID: plan.ID, EquipmentID: plan.EquipmentID, Name: plan.Name,
		IntervalDays: plan.IntervalDays, NextDue: plan.NextDue, Active: plan.Active,
	}
}

var maintenancePlanQueryAllowlist = map[string]struct{}{
	"equipment_id": {},
	"active":       {},
	"created_at":   {},
	"updated_at":   {},
}

type ListMaintenancePlansResponse struct {
	MaintenancePlans []MaintenancePlanResponse `json:"maintenance_plans"`
}

type ListMaintenancePlansResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ListMaintenancePlansResponse `json:"data"`
}

// @Summary List maintenance plans
// @Description Lists maintenance plans scoped to the caller's organization with pagination and filtering.
// @Tags Service & Maintenance
// @Accept json
// @Produce json
// @Success 200 {object} ListMaintenancePlansResponseEnvelope "Maintenance plans retrieved successfully."
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/maintenance-plans [get]
func (h ServiceHandler) ListMaintenancePlans(c fiber.Ctx) error {
	parsedQuery, err := httpx.ParseQueryParams(c, maintenancePlanQueryAllowlist)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid query parameters.", nil)
	}
	page, err := h.maintenance.ListPlans(c, parsedQuery)
	if err != nil {
		httpx.RequestLog(c).Error("maintenance plans list failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve maintenance plans.", err)
	}
	items := make([]MaintenancePlanResponse, len(page.Items))
	for i, plan := range page.Items {
		items[i] = newMaintenancePlanResponse(plan)
	}
	return httpx.CreateSuccessResponseWithMeta(c, "Maintenance plans retrieved successfully.", ListMaintenancePlansResponse{
		MaintenancePlans: items,
	}, httpx.BuildListMeta(parsedQuery, page.Count))
}

type GetMaintenancePlanResponse struct {
	MaintenancePlan MaintenancePlanResponse `json:"maintenance_plan"`
}

type GetMaintenancePlanResponseEnvelope struct {
	httpx.EnvelopeBase
	Data GetMaintenancePlanResponse `json:"data"`
}

// @Summary Get maintenance plan
// @Description Gets a single maintenance plan by id. A plan whose equipment belongs to another tenant returns 404.
// @Tags Service & Maintenance
// @Accept json
// @Produce json
// @Param id path integer true "Maintenance plan ID"
// @Success 200 {object} GetMaintenancePlanResponseEnvelope "Maintenance plan retrieved successfully."
// @Failure 404 {object} httpx.ErrorResponse "Maintenance plan not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/maintenance-plans/{id} [get]
func (h ServiceHandler) GetMaintenancePlan(c fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid id.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	plan, err := h.maintenance.FindPlanInOrg(c, id, organizationID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "Maintenance plan not found.")
		}
		httpx.RequestLog(c).Error("maintenance plan get failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve maintenance plan.", err)
	}
	if plan == nil {
		return httpx.CreateNotFoundResponse(c, "Maintenance plan not found.")
	}
	return httpx.CreateSuccessResponse(c, "Maintenance plan retrieved successfully.", GetMaintenancePlanResponse{
		MaintenancePlan: newMaintenancePlanResponse(plan),
	})
}

type CreateMaintenancePlanRequest struct {
	EquipmentID  uint64 `json:"equipment_id" validate:"required,gt=0"`
	Name         string `json:"name" validate:"required"`
	IntervalDays int    `json:"interval_days" validate:"required,gt=0"`
	NextDue      string `json:"next_due" validate:"required"`
}

type CreateMaintenancePlanResponse struct {
	MaintenancePlan MaintenancePlanResponse `json:"maintenance_plan"`
}

type CreateMaintenancePlanResponseEnvelope struct {
	httpx.EnvelopeBase
	Data CreateMaintenancePlanResponse `json:"data"`
}

// @Summary Create maintenance plan
// @Description Creates a preventive-maintenance plan that schedules a maintenance service order on each due date.
// @Tags Service & Maintenance
// @Accept json
// @Produce json
// @Param body body CreateMaintenancePlanRequest true "Maintenance plan details"
// @Success 201 {object} CreateMaintenancePlanResponseEnvelope "Maintenance plan created successfully."
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/maintenance-plans [post]
func (h ServiceHandler) CreateMaintenancePlan(c fiber.Ctx) error {
	var request CreateMaintenancePlanRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	nextDue, err := helper.ParseDateStr(request.NextDue)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid next_due.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	equipment, err := h.svc.FindEquipmentInOrg(c, request.EquipmentID, organizationID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "Equipment not found.")
		}
		httpx.RequestLog(c).Error("equipment get failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve equipment.", err)
	}
	if equipment == nil {
		return httpx.CreateNotFoundResponse(c, "Equipment not found.")
	}
	created, err := h.maintenance.CreatePlan(c, service.CreatePlanRequest{
		EquipmentID:  request.EquipmentID,
		Name:         request.Name,
		IntervalDays: request.IntervalDays,
		NextDue:      &nextDue,
	})
	if err != nil {
		return writeServiceError(c, err)
	}
	return httpx.CreateCreatedResponse(c, "Maintenance plan created successfully.", CreateMaintenancePlanResponse{
		MaintenancePlan: newMaintenancePlanResponse(created),
	})
}

type GenerateMaintenanceOrdersResponse struct {
	ServiceOrders []ServiceOrderResponse `json:"service_orders"`
}

type GenerateMaintenanceOrdersResponseEnvelope struct {
	httpx.EnvelopeBase
	Data GenerateMaintenanceOrdersResponse `json:"data"`
}

// @Summary Generate maintenance orders
// @Description Generates maintenance service orders for plans whose next_due has passed. The run is idempotent and scoped to the caller's organization.
// @Tags Service & Maintenance
// @Accept json
// @Produce json
// @Success 200 {object} GenerateMaintenanceOrdersResponseEnvelope "Maintenance orders generated successfully."
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/maintenance-plans/generate-orders [post]
func (h ServiceHandler) GenerateMaintenanceOrders(c fiber.Ctx) error {
	organizationID := httpx.TenantOrganizationID(c, nil)
	if organizationID == nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Organization ID is required.", nil)
	}
	generated, err := h.maintenance.GenerateDueOrdersNow(c, *organizationID)
	if err != nil {
		httpx.RequestLog(c).Error("maintenance orders generation failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to generate maintenance orders.", err)
	}
	items := make([]ServiceOrderResponse, len(generated))
	for i, order := range generated {
		items[i] = newServiceOrderResponse(order)
	}
	return httpx.CreateSuccessResponse(c, "Maintenance orders generated successfully.", GenerateMaintenanceOrdersResponse{
		ServiceOrders: items,
	})
}
