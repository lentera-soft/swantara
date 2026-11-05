package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/crm"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type ProspectHandler struct {
	stages dao.CRUD[reference.PipelineStage]
	svc    crm.ProspectService
}

func NewProspectHandler(stages dao.CRUD[reference.PipelineStage], svc crm.ProspectService) ProspectHandler {
	return ProspectHandler{stages: stages, svc: svc}
}

func writeProspectError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "crm prospect write failed", "Failed to save prospect.",
		httpx.NotFound(crm.ErrLeadNotFound, "Prospect not found."),
		httpx.Unprocessable(crm.ErrStageNotFound, "CRM stage does not exist."),
		httpx.Unprocessable(crm.ErrStageOrganization, "CRM stage does not belong to this organization."),
		httpx.Unprocessable(crm.ErrStageRequired, "A pipeline stage is required for an opportunity."),
		httpx.Unprocessable(crm.ErrContactNotFound, "CRM contact does not exist."),
		httpx.Unprocessable(crm.ErrSalespersonNotFound, "Salesperson does not exist."),
		httpx.Unprocessable(crm.ErrSalesGroupNotFound, "Sales team does not exist."),
		httpx.Unprocessable(crm.ErrContactOrganization, "CRM contact does not belong to this organization."),
		httpx.Unprocessable(crm.ErrSalespersonOrganization, "Salesperson does not belong to this organization."),
		httpx.Unprocessable(crm.ErrSalesGroupOrganization, "Sales team does not belong to this organization."),
		httpx.Unprocessable(crm.ErrOwnerNotMember, "Owner must be an active member of this organization."),
		httpx.Unprocessable(crm.ErrInvalidLeadType, "Prospect type must be prospect or opportunity."),
		httpx.Unprocessable(crm.ErrInvalidStatus, "Prospect status is invalid."),
		httpx.Conflict(crm.ErrInvalidStatusTransition, "This prospect status transition is not allowed."),
		httpx.Unprocessable(crm.ErrInvalidTemperature, "Prospect temperature is invalid."),
		httpx.Unprocessable(crm.ErrInvalidForecastCategory, "Forecast category is invalid."),
		httpx.Unprocessable(crm.ErrInvalidProbability, "Probability must be between 0 and 100."),
		httpx.Unprocessable(crm.ErrInvalidRevenue, "Expected revenue cannot be negative."),
		httpx.Unprocessable(crm.ErrInvalidBudget, "Budget cannot be negative."),
		httpx.Unprocessable(crm.ErrInvalidPriority, "Priority cannot be negative."),
		httpx.Unprocessable(crm.ErrInvalidFitScore, "Fit score must be between 0 and 100."),
		httpx.Unprocessable(crm.ErrInvalidIntentScore, "Intent score must be between 0 and 100."),
		httpx.Unprocessable(crm.ErrInvalidCurrency, "Currency must be a three-letter code."),
		httpx.Unprocessable(crm.ErrLeadNameRequired, "Prospect name is required."),
		httpx.Unprocessable(crm.ErrExitCriteriaNotMet, "The target stage exit criteria have not been met."),
		httpx.Conflict(crm.ErrDuplicateLead, "A prospect with the same email, phone, or name already exists."),
		httpx.Conflict(crm.ErrSameProspect, "A prospect cannot be merged into itself."),
		httpx.NotFound(crm.ErrMergeTargetNotFound, "Merge target not found."),
		httpx.Conflict(crm.ErrMergeOrganization, "Prospects belong to different organizations."),
		httpx.Unprocessable(crm.ErrInvalidBuyerRole, "Buying committee role is invalid."),
		httpx.Unprocessable(crm.ErrBuyingCommitteeUnavailable, "Buying committee is unavailable."),
		httpx.NotFound(crm.ErrBuyerNotFound, "Buying committee member not found."),
		httpx.Conflict(crm.ErrNotLead, "Only a prospect can be promoted to an opportunity."),
		httpx.Conflict(crm.ErrNotOpportunity, "Record is not an opportunity."),
		httpx.Conflict(crm.ErrLeadClosed, "Prospect is already closed."),
		httpx.Conflict(crm.ErrNoWonStage, "No won pipeline stage is configured."),
		httpx.Unprocessable(crm.ErrLostReasonRequired, "A lost reason is required."),
		httpx.Unprocessable(crm.ErrPromotionRequirementsUnmet, "Prospect does not meet the configured promotion requirements."),
		httpx.Conflict(crm.ErrLeadNotQualified, "Prospect must be qualified before it can be promoted."),
		httpx.Conflict(crm.ErrOpenOpportunityExists, "Contact already has an open opportunity. Attach the lead to that opportunity instead."),
		httpx.NotFound(crm.ErrOpportunityNotFound, "Opportunity not found."),
		httpx.Conflict(crm.ErrDoNotContact, "Prospect has opted out of outbound contact."),
		httpx.Unprocessable(crm.ErrInvalidTargetStage, "Promotion target must be an open pipeline stage."),
		httpx.Forbidden(crm.ErrPromotionOverrideForbidden, "You are not allowed to override promotion requirements."),
	)
}
