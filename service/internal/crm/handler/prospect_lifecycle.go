package handler

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/crm"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

type TransitionStatusRequest struct {
	Status         string  `json:"status" validate:"required"`
	Reason         string  `json:"reason"`
	LostReasonCode *string `json:"lost_reason_code"`
}

type TransitionStatusResponseEnvelope struct {
	httpx.EnvelopeBase
	Data TransitionStatusResponse `json:"data"`
}

type TransitionStatusResponse struct {
	Prospect ProspectResponse `json:"prospect"`
}

// @Summary Transition lead status
// @Description Moves a lead through the qualification lifecycle (new, contacted, qualified, nurtured, disqualified). A reason is required when disqualifying, and conversion/won/lost are handled by their dedicated endpoints.
// @Tags CRM Leads
// @Accept json
// @Produce json
// @Param id path integer true "CRM prospect ID"
// @Param body body TransitionStatusRequest true "Status transition"
// @Success 200 {object} TransitionStatusResponseEnvelope "Status updated successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Prospect not found"
// @Failure 409 {object} httpx.ErrorResponse "Transition not allowed"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/crm/leads/{id}/status [post]
func (h ProspectHandler) TransitionStatus(c fiber.Ctx) error {
	prospectID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid prospect id provided.", nil)
	}
	var request TransitionStatusRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	prospect, err := h.svc.FindInOrg(c, prospectID, organizationID)
	if err != nil || prospect == nil {
		return httpx.CreateNotFoundResponse(c, "Prospect not found.")
	}
	updated, err := h.svc.TransitionStatus(c, prospectID, crm.LeadTransitionInput{
		Status:         request.Status,
		Reason:         request.Reason,
		LostReasonCode: request.LostReasonCode,
	})
	if err != nil {
		return writeProspectError(c, err)
	}
	stages, err := loadStageMap(c, h.stages)
	if err != nil {
		httpx.RequestLog(c).Error("failed to update status", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to update status.", err)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "Status updated successfully.", TransitionStatusResponse{
		Prospect: newProspectResponse(updated, stages),
	})
}

type DuplicatesResponseEnvelope struct {
	httpx.EnvelopeBase
	Data DuplicatesResponse `json:"data"`
}

type DuplicatesResponse struct {
	Duplicates []ProspectResponse `json:"duplicates"`
}

// @Summary List lead duplicates
// @Description Returns other prospects in the organization that match this lead on email, phone, or exact name.
// @Tags CRM Leads
// @Accept json
// @Produce json
// @Param id path integer true "CRM prospect ID"
// @Success 200 {object} DuplicatesResponseEnvelope "Duplicates retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Prospect not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/crm/leads/{id}/duplicates [get]
func (h ProspectHandler) Duplicates(c fiber.Ctx) error {
	prospectID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid prospect id provided.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	prospect, err := h.svc.FindInOrg(c, prospectID, organizationID)
	if err != nil || prospect == nil {
		return httpx.CreateNotFoundResponse(c, "Prospect not found.")
	}
	duplicates, err := h.svc.Duplicates(c, prospectID)
	if err != nil {
		return writeProspectError(c, err)
	}
	stages, err := loadStageMap(c, h.stages)
	if err != nil {
		httpx.RequestLog(c).Error("failed to load duplicates", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to load duplicates.", err)
	}
	items := make([]ProspectResponse, len(duplicates))
	for i, duplicate := range duplicates {
		items[i] = newProspectResponse(duplicate, stages)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "Duplicates retrieved successfully.", DuplicatesResponse{Duplicates: items})
}

type MergeProspectRequest struct {
	TargetID uint64 `json:"target_id" validate:"required,gt=0"`
}

type MergeProspectResponseEnvelope struct {
	httpx.EnvelopeBase
	Data MergeProspectResponse `json:"data"`
}

type MergeProspectResponse struct {
	Prospect ProspectResponse `json:"prospect"`
}

// @Summary Merge duplicate prospect
// @Description Merges this prospect into another prospect in the same organization, moving activities, buying committee links, and stage history to the target and deleting the source.
// @Tags CRM Leads
// @Accept json
// @Produce json
// @Param id path integer true "Source prospect ID"
// @Param body body MergeProspectRequest true "Merge target"
// @Success 200 {object} MergeProspectResponseEnvelope "Prospect merged successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Prospect or target not found"
// @Failure 409 {object} httpx.ErrorResponse "Invalid merge"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/crm/leads/{id}/merge [post]
func (h ProspectHandler) Merge(c fiber.Ctx) error {
	prospectID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid prospect id provided.", nil)
	}
	var request MergeProspectRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	prospect, err := h.svc.FindInOrg(c, prospectID, organizationID)
	if err != nil || prospect == nil {
		return httpx.CreateNotFoundResponse(c, "Prospect not found.")
	}
	merged, err := h.svc.Merge(c, prospectID, request.TargetID)
	if err != nil {
		return writeProspectError(c, err)
	}
	stages, err := loadStageMap(c, h.stages)
	if err != nil {
		httpx.RequestLog(c).Error("failed to merge prospect", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to merge prospect.", err)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "Prospect merged successfully.", MergeProspectResponse{
		Prospect: newProspectResponse(merged, stages),
	})
}

type StageHistoryResponseEnvelope struct {
	httpx.EnvelopeBase
	Data StageHistoryResponse `json:"data"`
}

type StageHistoryResponse struct {
	History []StageHistoryEntry `json:"history"`
}

type StageHistoryEntry struct {
	ID          uint64    `json:"id"`
	ProspectID  uint64    `json:"prospect_id"`
	FromStageID *uint64   `json:"from_stage_id"`
	ToStageID   *uint64   `json:"to_stage_id"`
	FromStatus  *string   `json:"from_status"`
	ToStatus    *string   `json:"to_status"`
	Probability float64   `json:"probability"`
	Notes       *string   `json:"notes"`
	ActorID     *uint64   `json:"actor_id"`
	CreatedAt   time.Time `json:"created_at"`
}

// @Summary Get prospect stage history
// @Description Returns the ordered stage and status history for a prospect or opportunity.
// @Tags CRM Leads
// @Accept json
// @Produce json
// @Param id path integer true "CRM prospect ID"
// @Success 200 {object} StageHistoryResponseEnvelope "History retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Prospect not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/crm/leads/{id}/history [get]
func (h ProspectHandler) StageHistory(c fiber.Ctx) error {
	return h.stageHistory(c)
}

// @Summary Get opportunity stage history
// @Description Returns the ordered stage and status history for an opportunity.
// @Tags CRM Opportunities
// @Accept json
// @Produce json
// @Param id path integer true "CRM opportunity ID"
// @Success 200 {object} StageHistoryResponseEnvelope "History retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Opportunity not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/crm/opportunities/{id}/history [get]
func (h OpportunityHandler) StageHistory(c fiber.Ctx) error {
	return h.stageHistory(c)
}

func (h ProspectHandler) stageHistory(c fiber.Ctx) error {
	prospectID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid prospect id provided.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	prospect, err := h.svc.FindInOrg(c, prospectID, organizationID)
	if err != nil || prospect == nil {
		return httpx.CreateNotFoundResponse(c, "Prospect not found.")
	}
	history, err := h.svc.StageHistory(c, prospectID)
	if err != nil {
		return writeProspectError(c, err)
	}
	items := make([]StageHistoryEntry, len(history))
	for i, entry := range history {
		items[i] = StageHistoryEntry{
			ID:          entry.ID,
			ProspectID:  entry.ProspectID,
			FromStageID: entry.FromStageID,
			ToStageID:   entry.ToStageID,
			FromStatus:  entry.FromStatus,
			ToStatus:    entry.ToStatus,
			Probability: entry.Probability,
			Notes:       entry.Notes,
			ActorID:     entry.ActorID,
			CreatedAt:   entry.CreatedAt,
		}
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "History retrieved successfully.", StageHistoryResponse{History: items})
}

func (h OpportunityHandler) stageHistory(c fiber.Ctx) error {
	prospectID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid opportunity id provided.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	prospect, err := h.svc.FindInOrg(c, prospectID, organizationID)
	if err != nil || prospect == nil || prospect.Type != crm.ProspectKindOpportunity {
		return httpx.CreateNotFoundResponse(c, "Opportunity not found.")
	}
	history, err := h.svc.StageHistory(c, prospectID)
	if err != nil {
		return writeProspectError(c, err)
	}
	items := make([]StageHistoryEntry, len(history))
	for i, entry := range history {
		items[i] = StageHistoryEntry{
			ID:          entry.ID,
			ProspectID:  entry.ProspectID,
			FromStageID: entry.FromStageID,
			ToStageID:   entry.ToStageID,
			FromStatus:  entry.FromStatus,
			ToStatus:    entry.ToStatus,
			Probability: entry.Probability,
			Notes:       entry.Notes,
			ActorID:     entry.ActorID,
			CreatedAt:   entry.CreatedAt,
		}
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "History retrieved successfully.", StageHistoryResponse{History: items})
}

type BuyerRequest struct {
	ContactID uint64 `json:"contact_id" validate:"required,gt=0"`
	Role      string `json:"role"`
	IsPrimary bool   `json:"is_primary"`
}

type BuyerResponseEnvelope struct {
	httpx.EnvelopeBase
	Data BuyerResponse `json:"data"`
}

type BuyerResponse struct {
	Buyer BuyerEntry `json:"buyer"`
}

type BuyerEntry struct {
	ID         uint64 `json:"id"`
	ProspectID uint64 `json:"prospect_id"`
	ContactID  uint64 `json:"contact_id"`
	Role       string `json:"role"`
	IsPrimary  bool   `json:"is_primary"`
}

type BuyerListResponseEnvelope struct {
	httpx.EnvelopeBase
	Data BuyerListResponse `json:"data"`
}

type BuyerListResponse struct {
	Buyers []BuyerEntry `json:"buyers"`
}

// @Summary Add opportunity buying contact
// @Description Adds a contact to the opportunity buying committee with a role such as user, technical, economic_buyer, champion, or blocker.
// @Tags CRM Opportunities
// @Accept json
// @Produce json
// @Param id path integer true "CRM opportunity ID"
// @Param body body BuyerRequest true "Buying contact"
// @Success 201 {object} BuyerResponseEnvelope "Buying contact added successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Opportunity or contact not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/crm/opportunities/{id}/buyers [post]
func (h OpportunityHandler) AddBuyer(c fiber.Ctx) error {
	return h.addBuyer(c)
}

// @Summary List opportunity buying contacts
// @Description Lists the buying committee for an opportunity, including roles and the primary contact flag.
// @Tags CRM Opportunities
// @Accept json
// @Produce json
// @Param id path integer true "CRM opportunity ID"
// @Success 200 {object} BuyerListResponseEnvelope "Buying contacts retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Opportunity not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/crm/opportunities/{id}/buyers [get]
func (h OpportunityHandler) ListBuyers(c fiber.Ctx) error {
	return h.listBuyers(c)
}

// @Summary Remove opportunity buying contact
// @Description Removes a buying committee member from an opportunity.
// @Tags CRM Opportunities
// @Accept json
// @Produce json
// @Param id path integer true "CRM opportunity ID"
// @Param buyer_id path integer true "Buying committee member ID"
// @Success 204 "No Content"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Opportunity not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/crm/opportunities/{id}/buyers/{buyer_id} [delete]
func (h OpportunityHandler) RemoveBuyer(c fiber.Ctx) error {
	return h.removeBuyer(c)
}

func (h ProspectHandler) AddBuyer(c fiber.Ctx) error {
	return addBuyer(c, h.svc)
}

func (h ProspectHandler) ListBuyers(c fiber.Ctx) error {
	return listBuyers(c, h.svc)
}

func (h ProspectHandler) RemoveBuyer(c fiber.Ctx) error {
	return removeBuyer(c, h.svc)
}

func (h OpportunityHandler) addBuyer(c fiber.Ctx) error {
	return addBuyer(c, h.svc)
}

func (h OpportunityHandler) listBuyers(c fiber.Ctx) error {
	return listBuyers(c, h.svc)
}

func (h OpportunityHandler) removeBuyer(c fiber.Ctx) error {
	return removeBuyer(c, h.svc)
}

func addBuyer(c fiber.Ctx, svc crm.ProspectService) error {
	prospectID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid opportunity id provided.", nil)
	}
	var request BuyerRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	buyer, err := svc.AddBuyer(c, organizationID, prospectID, crm.ProspectBuyerInput{
		ContactID: request.ContactID,
		Role:      request.Role,
		IsPrimary: request.IsPrimary,
	})
	if err != nil {
		return writeProspectError(c, err)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateCreatedResponse(c, "Buying contact added successfully.", BuyerResponse{Buyer: newBuyerEntry(buyer)})
}

func listBuyers(c fiber.Ctx, svc crm.ProspectService) error {
	prospectID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid opportunity id provided.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	buyers, err := svc.ListBuyers(c, organizationID, prospectID)
	if err != nil {
		return writeProspectError(c, err)
	}
	items := make([]BuyerEntry, len(buyers))
	for i, buyer := range buyers {
		items[i] = newBuyerEntry(buyer)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "Buying contacts retrieved successfully.", BuyerListResponse{Buyers: items})
}

func newBuyerEntry(buyer *crm.ProspectContact) BuyerEntry {
	return BuyerEntry{
		ID:         buyer.ID,
		ProspectID: buyer.ProspectID,
		ContactID:  buyer.ContactID,
		Role:       buyer.Role,
		IsPrimary:  buyer.IsPrimary,
	}
}

func removeBuyer(c fiber.Ctx, svc crm.ProspectService) error {
	prospectID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid opportunity id provided.", nil)
	}
	buyerID, err := strconv.ParseUint(c.Params("buyer_id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid buyer id provided.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	if err := svc.RemoveBuyer(c, organizationID, prospectID, buyerID); err != nil {
		return writeProspectError(c, err)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateNoContentResponse(c)
}

type ReassignOwnerRequest struct {
	OwnerUserID *uint64 `json:"owner_user_id"`
}

type ReassignOwnerResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ReassignOwnerResponse `json:"data"`
}

type ReassignOwnerResponse struct {
	Prospect ProspectResponse `json:"prospect"`
}

// @Summary Reassign prospect owner
// @Description Assigns a new owner to a lead or opportunity, or clears the owner when owner_user_id is omitted.
// @Tags CRM Leads
// @Accept json
// @Produce json
// @Param id path integer true "CRM prospect ID"
// @Param body body ReassignOwnerRequest true "Owner assignment"
// @Success 200 {object} ReassignOwnerResponseEnvelope "Owner updated successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Prospect not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/crm/leads/{id}/owner [post]
func (h ProspectHandler) ReassignOwner(c fiber.Ctx) error {
	prospectID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid prospect id provided.", nil)
	}
	var request ReassignOwnerRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	updated, err := h.svc.ReassignOwner(c, prospectID, organizationID, request.OwnerUserID)
	if err != nil {
		return writeProspectError(c, err)
	}
	stages, err := loadStageMap(c, h.stages)
	if err != nil {
		return httpx.CreateInternalServerErrorResponse(c, "Failed to update owner.", err)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "Owner updated successfully.", ReassignOwnerResponse{
		Prospect: newProspectResponse(updated, stages),
	})
}

// ReassignOpportunityOwner mirrors ReassignOwner for opportunity routes.
func (h OpportunityHandler) ReassignOwner(c fiber.Ctx) error {
	prospectID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid opportunity id provided.", nil)
	}
	var request ReassignOwnerRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	updated, err := h.svc.ReassignOwner(c, prospectID, organizationID, request.OwnerUserID)
	if err != nil {
		return writeProspectError(c, err)
	}
	stages, err := loadStageMap(c, h.stages)
	if err != nil {
		return httpx.CreateInternalServerErrorResponse(c, "Failed to update owner.", err)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "Owner updated successfully.", ReassignOwnerResponse{
		Prospect: newProspectResponse(updated, stages),
	})
}

type ReassignOwnersRequest struct {
	ProspectIDs []uint64 `json:"prospect_ids" validate:"required,min=1,dive,gt=0"`
	OwnerUserID *uint64  `json:"owner_user_id"`
}

type ReassignOwnersResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ReassignOwnersResponse `json:"data"`
}

type ReassignOwnersResponse struct {
	UpdatedCount int `json:"updated_count"`
}

// @Summary Bulk reassign prospect owners
// @Description Reassigns multiple leads or opportunities to a new owner, or clears ownership when owner_user_id is omitted.
// @Tags CRM Leads
// @Accept json
// @Produce json
// @Param body body ReassignOwnersRequest true "Bulk owner assignment"
// @Success 200 {object} ReassignOwnersResponseEnvelope "Owners updated successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Prospect not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/crm/leads/reassign [post]
func (h ProspectHandler) ReassignOwners(c fiber.Ctx) error {
	var request ReassignOwnersRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	updated, err := h.svc.ReassignOwners(c, organizationID, request.ProspectIDs, request.OwnerUserID)
	if err != nil {
		return writeProspectError(c, err)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "Owners updated successfully.", ReassignOwnersResponse{
		UpdatedCount: len(updated),
	})
}
