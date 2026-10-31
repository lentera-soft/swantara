package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/kernel/scope"
	"github.com/jalusw/swantara/apps/service/internal/reference"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type WorkCenterRequest struct {
	Name            string   `json:"name" validate:"required"`
	Code            *string  `json:"code"`
	CostPerHour     *float64 `json:"cost_per_hour"`
	CapacityPerHour *float64 `json:"capacity_per_hour"`
	EfficiencyPct   float64  `json:"efficiency_pct"`
	OeeTarget       *float64 `json:"oee_target"`
	DimensionID     *uint64  `json:"dimension_id"`
}

func newWorkCenterResponse(center *reference.WorkCenter) WorkCenterResponse {
	return WorkCenterResponse{
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

func (h WorkCenterHandler) findInOrg(c fiber.Ctx, id uint64) (*reference.WorkCenter, error) {
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return nil, httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	center, err := h.centers.Find(c, id)
	if err != nil {
		if dao.IsNotFound(err) {
			return nil, httpx.CreateNotFoundResponse(c, "Work center not found.")
		}
		return nil, httpx.CreateInternalServerErrorResponse(c, "Failed to get work center.", err)
	}
	if center == nil || !scope.Owns(center.OrganizationID, organizationID) {
		return nil, httpx.CreateNotFoundResponse(c, "Work center not found.")
	}
	return center, nil
}

// @Summary Get work center
// @Description Gets a single work center by its id, including its cost, capacity, efficiency, and OEE target. The work center is returned only when it belongs to the caller's organization.
// @Tags Work Centers
// @Accept json
// @Produce json
// @Param id path integer true "Work center ID"
// @Success 200 {object} GetWorkCenterResponseEnvelope "Work center retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Work center not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/work-centers/{id} [get]
func (h WorkCenterHandler) Get(c fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid work center id provided.", nil)
	}
	center, err := h.findInOrg(c, id)
	if err != nil {
		return err
	}
	return httpx.CreateSuccessResponse(c, "Work center retrieved successfully.", GetWorkCenterResponse{
		WorkCenter: newWorkCenterResponse(center),
	})
}

// @Summary Create work center
// @Description Creates a work center for the caller's organization. A name is required; cost per hour, capacity per hour, efficiency percentage, OEE target, and dimension can be supplied optionally.
// @Tags Work Centers
// @Accept json
// @Produce json
// @Param body body WorkCenterRequest true "Work center details"
// @Success 201 {object} GetWorkCenterResponseEnvelope "Work center created successfully."
// @Failure 400 {object} httpx.ErrorResponse "Bad request"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/work-centers [post]
func (h WorkCenterHandler) Create(c fiber.Ctx) error {
	var request WorkCenterRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	center, err := h.centers.Create(c, &reference.WorkCenter{
		OrganizationID:  &organizationID,
		Name:            request.Name,
		Code:            request.Code,
		CostPerHour:     request.CostPerHour,
		CapacityPerHour: request.CapacityPerHour,
		EfficiencyPct:   request.EfficiencyPct,
		OeeTarget:       request.OeeTarget,
		DimensionID:     request.DimensionID,
	})
	if err != nil {
		return httpx.CreateInternalServerErrorResponse(c, "Failed to create work center.", err)
	}
	return httpx.CreateCreatedResponse(c, "Work center created successfully.", GetWorkCenterResponse{
		WorkCenter: newWorkCenterResponse(center),
	})
}

// @Summary Update work center
// @Description Updates an existing work center belonging to the caller's organization. A name is required; cost per hour, capacity per hour, efficiency percentage, OEE target, and dimension can be changed.
// @Tags Work Centers
// @Accept json
// @Produce json
// @Param id path integer true "Work center ID"
// @Param body body WorkCenterRequest true "Work center details"
// @Success 200 {object} GetWorkCenterResponseEnvelope "Work center updated successfully."
// @Failure 400 {object} httpx.ErrorResponse "Bad request"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Work center not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/work-centers/{id} [put]
func (h WorkCenterHandler) Update(c fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid work center id provided.", nil)
	}
	var request WorkCenterRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	center, err := h.findInOrg(c, id)
	if err != nil {
		return err
	}

	center.Name = request.Name
	center.Code = request.Code
	center.CostPerHour = request.CostPerHour
	center.CapacityPerHour = request.CapacityPerHour
	center.EfficiencyPct = request.EfficiencyPct
	center.OeeTarget = request.OeeTarget
	center.DimensionID = request.DimensionID

	updated, err := h.centers.Update(c, center)
	if err != nil {
		return httpx.CreateInternalServerErrorResponse(c, "Failed to update work center.", err)
	}
	return httpx.CreateSuccessResponse(c, "Work center updated successfully.", GetWorkCenterResponse{
		WorkCenter: newWorkCenterResponse(updated),
	})
}

// @Summary Delete work center
// @Description Deletes a work center belonging to the caller's organization. Responds with 204 No Content on success.
// @Tags Work Centers
// @Accept json
// @Produce json
// @Param id path integer true "Work center ID"
// @Success 204 "No Content"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Work center not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/work-centers/{id} [delete]
func (h WorkCenterHandler) Delete(c fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid work center id provided.", nil)
	}
	if _, err := h.findInOrg(c, id); err != nil {
		return err
	}
	if err := h.centers.Delete(c, id); err != nil {
		return httpx.CreateInternalServerErrorResponse(c, "Failed to delete work center.", err)
	}
	return httpx.CreateNoContentResponse(c)
}

type GetWorkCenterResponseEnvelope struct {
	httpx.EnvelopeBase
	Data GetWorkCenterResponse `json:"data"`
}
type GetWorkCenterResponse struct {
	WorkCenter WorkCenterResponse `json:"work_center"`
}
