package handler

import (
	"errors"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/contacts"
	"github.com/jalusw/swantara/apps/service/internal/crm"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type PipelineStageHandler struct {
	stages dao.CRUD[reference.PipelineStage]
}

func NewPipelineStageHandler(stages dao.CRUD[reference.PipelineStage]) PipelineStageHandler {
	return PipelineStageHandler{stages: stages}
}

type PipelineStageResponse struct {
	ID             uint64  `json:"id"`
	OrganizationID *uint64 `json:"organization_id"`
	Name           string  `json:"name"`
	Sequence       int     `json:"sequence"`
	IsWon          bool    `json:"is_won"`
	IsLost         bool    `json:"is_lost"`
	ExitCriteria   *string `json:"exit_criteria"`
	Probability    float64 `json:"probability"`
}

type ListPipelineStagesResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ListPipelineStagesResponse `json:"data"`
}
type ListPipelineStagesResponse struct {
	Stages []PipelineStageResponse `json:"stages"`
}

// @Summary List CRM stages
// @Description Lists the caller's organization's CRM pipeline stages ordered by their sequence, including each stage's name, win flag, and probability. These stages define the pipeline used when creating, promoting, advancing, winning, or losing opportunities.
// @Tags CRM Stages
// @Accept json
// @Produce json
// @Success 200 {object} ListPipelineStagesResponseEnvelope "Stages retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/crm/stages [get]
func (h PipelineStageHandler) List(c fiber.Ctx) error {
	parsedQuery := &query.Query{
		Sorts: []query.Sort{{Field: "sequence", Direction: query.Ascending}},
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	page, err := h.stages.ListInOrg(c, parsedQuery, organizationID)
	if err != nil {
		httpx.RequestLog(c).Error("crm stage list failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve stages.", err)
	}

	items := make([]PipelineStageResponse, len(page.Items))
	for i, stage := range page.Items {
		items[i] = PipelineStageResponse{
			ID:             stage.ID,
			OrganizationID: stage.OrganizationID,
			Name:           stage.Name,
			Sequence:       stage.Sequence,
			IsWon:          stage.IsWon,
			IsLost:         stage.IsLost,
			ExitCriteria:   stage.ExitCriteria,
			Probability:    stage.Probability,
		}
	}

	return httpx.CreateSuccessResponse(c, "Stages retrieved successfully.", ListPipelineStagesResponse{
		Stages: items,
	})
}

type SalesGroupHandler struct {
	svc crm.SalesGroupService
}

func NewSalesGroupHandler(teams dao.CRUD[reference.SalesGroup]) SalesGroupHandler {
	return SalesGroupHandler{svc: crm.NewSalesGroupService(teams, nil)}
}

func (h SalesGroupHandler) WithContacts(contacts contacts.ContactDAO) SalesGroupHandler {
	return SalesGroupHandler{svc: h.svc.WithContacts(contacts)}
}

type SalesGroupResponse struct {
	ID             uint64    `json:"id"`
	Name           string    `json:"name"`
	LeaderID       *uint64   `json:"leader_id"`
	OrganizationID *uint64   `json:"organization_id"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func newSalesGroupResponse(team *reference.SalesGroup) SalesGroupResponse {
	return SalesGroupResponse{
		ID:             team.ID,
		Name:           team.Name,
		LeaderID:       team.LeaderID,
		OrganizationID: team.OrganizationID,
		CreatedAt:      team.CreatedAt,
		UpdatedAt:      team.UpdatedAt,
	}
}

type ListSalesGroupsResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ListSalesGroupsResponse `json:"data"`
}
type ListSalesGroupsResponse struct {
	Teams []SalesGroupResponse `json:"teams"`
}

func writeSalesGroupError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "crm sales team write failed", "Failed to save sales team.",
		httpx.NotFound(crm.ErrSalesGroupNotFound, "Sales team not found."),
		httpx.Unprocessable(crm.ErrSalesGroupNameRequired, "Sales team name is required."),
		httpx.Unprocessable(crm.ErrSalesGroupLeaderNotFound, "Team leader does not exist."),
		httpx.Unprocessable(crm.ErrSalesGroupLeaderOrganization, "Team leader does not belong to the organization."),
	)
}

// @Summary List sales teams
// @Description Lists CRM sales teams scoped to the caller's organization, including each team's leader and organization. The tenant filter is always enforced so callers only see their own organization's teams.
// @Tags CRM Teams
// @Accept json
// @Produce json
// @Success 200 {object} ListSalesGroupsResponseEnvelope "Sales teams retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/crm/teams [get]
func (h SalesGroupHandler) List(c fiber.Ctx) error {
	parsedQuery := &query.Query{}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	page, err := h.svc.ListInOrg(c, parsedQuery, organizationID)
	if err != nil {
		httpx.RequestLog(c).Error("crm sales team list failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve sales teams.", err)
	}

	items := make([]SalesGroupResponse, len(page.Items))
	for i, team := range page.Items {
		items[i] = newSalesGroupResponse(team)
	}

	return httpx.CreateSuccessResponse(c, "Sales teams retrieved successfully.", ListSalesGroupsResponse{
		Teams: items,
	})
}

type GetSalesGroupResponseEnvelope struct {
	httpx.EnvelopeBase
	Data GetSalesGroupResponse `json:"data"`
}
type GetSalesGroupResponse struct {
	Team SalesGroupResponse `json:"team"`
}

// @Summary Get sales team
// @Description Gets a single CRM sales team by id. The team must belong to the caller's organization, otherwise a 404 is returned.
// @Tags CRM Teams
// @Accept json
// @Produce json
// @Param id path int true "Sales Team ID"
// @Success 200 {object} GetSalesGroupResponseEnvelope "Sales team retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Sales team not found"
// @Failure 422 {object} httpx.ErrorResponse "Invalid sales team id provided"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/crm/teams/{id} [get]
func (h SalesGroupHandler) Get(c fiber.Ctx) error {
	teamID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid sales team id provided.", nil)
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	team, err := h.svc.FindInOrg(c, teamID, organizationID)
	if err != nil {
		if dao.IsNotFound(err) || errors.Is(err, crm.ErrSalesGroupNotFound) {
			return httpx.CreateNotFoundResponse(c, "Sales team not found.")
		}
		httpx.RequestLog(c).Error("crm sales team lookup failed", "team_id", teamID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to get sales team.", err)
	}
	if team == nil {
		return httpx.CreateNotFoundResponse(c, "Sales team not found.")
	}

	return httpx.CreateSuccessResponse(c, "Sales team retrieved successfully.", GetSalesGroupResponse{
		Team: newSalesGroupResponse(team),
	})
}

type CreateSalesGroupRequest struct {
	OrganizationID *uint64 `json:"organization_id"`
	Name           string  `json:"name" validate:"required"`
	LeaderID       *uint64 `json:"leader_id"`
}

type CreateSalesGroupResponseEnvelope struct {
	httpx.EnvelopeBase
	Data CreateSalesGroupResponse `json:"data"`
}
type CreateSalesGroupResponse struct {
	Team SalesGroupResponse `json:"team"`
}

// @Summary Create sales team
// @Description Creates a new CRM sales team within the caller's organization. The optional leader must be a contact belonging to the same organization.
// @Tags CRM Teams
// @Accept json
// @Produce json
// @Param body body CreateSalesGroupRequest true "Sales team payload"
// @Success 201 {object} CreateSalesGroupResponseEnvelope "Sales team created successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/crm/teams [post]
func (h SalesGroupHandler) Create(c fiber.Ctx) error {
	var request CreateSalesGroupRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}

	organizationID := httpx.TenantOrganizationID(c, request.OrganizationID)
	if organizationID == nil {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	team, err := h.svc.Create(c, &reference.SalesGroup{
		Name:           request.Name,
		LeaderID:       request.LeaderID,
		OrganizationID: organizationID,
	})
	if err != nil {
		return writeSalesGroupError(c, err)
	}

	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateCreatedResponse(c, "Sales team created successfully.", CreateSalesGroupResponse{
		Team: newSalesGroupResponse(team),
	})
}

type UpdateSalesGroupRequest struct {
	Name     string  `json:"name" validate:"required"`
	LeaderID *uint64 `json:"leader_id"`
}

type UpdateSalesGroupResponseEnvelope struct {
	httpx.EnvelopeBase
	Data UpdateSalesGroupResponse `json:"data"`
}
type UpdateSalesGroupResponse struct {
	Team SalesGroupResponse `json:"team"`
}

// @Summary Update sales team
// @Description Updates an existing CRM sales team. The team must belong to the caller's organization, otherwise a 404 is returned.
// @Tags CRM Teams
// @Accept json
// @Produce json
// @Param id path int true "Sales Team ID"
// @Param body body UpdateSalesGroupRequest true "Sales team payload"
// @Success 200 {object} UpdateSalesGroupResponseEnvelope "Sales team updated successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Sales team not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/crm/teams/{id} [put]
func (h SalesGroupHandler) Update(c fiber.Ctx) error {
	teamID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid sales team id provided.", nil)
	}

	var request UpdateSalesGroupRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	team := &reference.SalesGroup{
		Base:     model.Base{ID: teamID},
		Name:     request.Name,
		LeaderID: request.LeaderID,
	}

	updated, err := h.svc.Update(c, organizationID, team)
	if err != nil {
		return writeSalesGroupError(c, err)
	}

	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "Sales team updated successfully.", UpdateSalesGroupResponse{
		Team: newSalesGroupResponse(updated),
	})
}

// @Summary Delete sales team
// @Description Deletes a CRM sales team. The team must belong to the caller's organization, otherwise a 404 is returned.
// @Tags CRM Teams
// @Accept json
// @Produce json
// @Param id path int true "Sales Team ID"
// @Success 204 "No content"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Sales team not found"
// @Failure 422 {object} httpx.ErrorResponse "Invalid sales team id provided"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/crm/teams/{id} [delete]
func (h SalesGroupHandler) Delete(c fiber.Ctx) error {
	teamID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid sales team id provided.", nil)
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	if err := h.svc.Delete(c, organizationID, teamID); err != nil {
		return writeSalesGroupError(c, err)
	}

	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateNoContentResponse(c)
}
