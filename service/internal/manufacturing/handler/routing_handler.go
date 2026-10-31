package handler

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/manufacturing"
)

type RoutingHandler struct {
	svc manufacturing.RoutingService
}

func NewRoutingHandler(svc manufacturing.RoutingService) RoutingHandler {
	return RoutingHandler{svc: svc}
}

type RoutingOperationResponse struct {
	ID           uint64    `json:"id"`
	RecipeID     *uint64   `json:"recipe_id"`
	WorkCenterID *uint64   `json:"work_center_id"`
	Name         *string   `json:"name"`
	Sequence     int       `json:"sequence"`
	SetupMinutes float64   `json:"setup_minutes"`
	TimeMinutes  float64   `json:"time_minutes"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func newRoutingOperationResponse(step *manufacturing.ProductionStep) RoutingOperationResponse {
	return RoutingOperationResponse{
		ID:           step.ID,
		RecipeID:     step.RecipeID,
		WorkCenterID: step.WorkCenterID,
		Name:         step.Name,
		Sequence:     step.Sequence,
		SetupMinutes: step.SetupMinutes,
		TimeMinutes:  step.TimeMinutes,
		CreatedAt:    step.CreatedAt,
		UpdatedAt:    step.UpdatedAt,
	}
}

type ListRoutingOperationsResponse struct {
	Operations []RoutingOperationResponse `json:"operations"`
}

type RoutingOperationRequest struct {
	WorkCenterID *uint64 `json:"work_center_id" validate:"required,gt=0"`
	Name         *string `json:"name" validate:"required"`
	Sequence     int     `json:"sequence"`
	SetupMinutes float64 `json:"setup_minutes"`
	TimeMinutes  float64 `json:"time_minutes"`
}

func routingStepFromRequest(request RoutingOperationRequest) *manufacturing.ProductionStep {
	return &manufacturing.ProductionStep{
		WorkCenterID: request.WorkCenterID,
		Name:         request.Name,
		Sequence:     request.Sequence,
		SetupMinutes: request.SetupMinutes,
		TimeMinutes:  request.TimeMinutes,
	}
}

func writeRoutingError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "routing operation failed", "Failed to save routing operation.",
		httpx.NotFound(manufacturing.ErrRecipeNotFound, "Recipe not found."),
		httpx.NotFound(manufacturing.ErrRoutingStepNotFound, "Routing operation not found."),
		httpx.Unprocessable(manufacturing.ErrRoutingWorkCenter, "Routing operation requires a work center."),
		httpx.Unprocessable(manufacturing.ErrRoutingName, "Routing operation requires a name."),
		httpx.Unprocessable(manufacturing.ErrRoutingSequence, "Routing operation sequence cannot be negative."),
		httpx.Unprocessable(manufacturing.ErrRoutingMinutes, "Routing operation minutes cannot be negative."),
	)
}

func routingIDs(c fiber.Ctx) (recipeID uint64, organizationID uint64, ok bool) {
	recipeID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return 0, 0, false
	}
	organizationID, ok = httpx.CallerOrganizationID(c)
	return recipeID, organizationID, ok
}

func (h RoutingHandler) List(c fiber.Ctx) error {
	recipeID, organizationID, ok := routingIDs(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	steps, err := h.svc.ListInOrg(c, recipeID, organizationID)
	if err != nil {
		return writeRoutingError(c, err)
	}

	items := make([]RoutingOperationResponse, len(steps))
	for i, step := range steps {
		items[i] = newRoutingOperationResponse(step)
	}
	return httpx.CreateSuccessResponse(c, "Routing operations retrieved successfully.", ListRoutingOperationsResponse{
		Operations: items,
	})
}

func (h RoutingHandler) Create(c fiber.Ctx) error {
	recipeID, organizationID, ok := routingIDs(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	var request RoutingOperationRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}

	step, err := h.svc.CreateInOrg(c, recipeID, organizationID, routingStepFromRequest(request))
	if err != nil {
		return writeRoutingError(c, err)
	}
	return httpx.CreateCreatedResponse(c, "Routing operation created successfully.", RoutingOperationResponse{
		ID:           step.ID,
		RecipeID:     step.RecipeID,
		WorkCenterID: step.WorkCenterID,
		Name:         step.Name,
		Sequence:     step.Sequence,
		SetupMinutes: step.SetupMinutes,
		TimeMinutes:  step.TimeMinutes,
		CreatedAt:    step.CreatedAt,
		UpdatedAt:    step.UpdatedAt,
	})
}

func (h RoutingHandler) Update(c fiber.Ctx) error {
	recipeID, organizationID, ok := routingIDs(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	stepID, err := strconv.ParseUint(c.Params("step_id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid routing operation id provided.", nil)
	}

	var request RoutingOperationRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}

	step, err := h.svc.UpdateInOrg(c, recipeID, stepID, organizationID, routingStepFromRequest(request))
	if err != nil {
		return writeRoutingError(c, err)
	}
	return httpx.CreateSuccessResponse(c, "Routing operation updated successfully.", newRoutingOperationResponse(step))
}

func (h RoutingHandler) Delete(c fiber.Ctx) error {
	recipeID, organizationID, ok := routingIDs(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	stepID, err := strconv.ParseUint(c.Params("step_id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid routing operation id provided.", nil)
	}

	if err := h.svc.DeleteInOrg(c, recipeID, stepID, organizationID); err != nil {
		return writeRoutingError(c, err)
	}
	return httpx.CreateSuccessResponse(c, "Routing operation deleted successfully.", struct{}{})
}
