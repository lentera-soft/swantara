package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/commission"
	"github.com/jalusw/swantara/apps/service/internal/httpx"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type CommissionRuleResponse struct {
	ID             uint64  `json:"id"`
	PlanID         uint64  `json:"plan_id"`
	ItemCategoryID *uint64 `json:"item_category_id"`
	MinAmount      float64 `json:"min_amount"`
	MaxAmount      float64 `json:"max_amount"`
	RatePct        float64 `json:"rate_pct"`
	FixedAmount    float64 `json:"fixed_amount"`
}

func newCommissionRuleResponse(rule *commission.CommissionRule) CommissionRuleResponse {
	return CommissionRuleResponse{
		ID: rule.ID, PlanID: rule.PlanID, ItemCategoryID: rule.ItemCategoryID,
		MinAmount: rule.MinAmount, MaxAmount: rule.MaxAmount, RatePct: rule.RatePct, FixedAmount: rule.FixedAmount,
	}
}

type ListCommissionRulesResponse struct {
	CommissionRules []CommissionRuleResponse `json:"commission_rules"`
}

type ListCommissionRulesResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ListCommissionRulesResponse `json:"data"`
}

// @Summary List commission rules
// @Description Lists the rules of a commission plan. The plan must belong to the caller's organization.
// @Tags Commissions
// @Accept json
// @Produce json
// @Param id path integer true "Commission plan ID"
// @Success 200 {object} ListCommissionRulesResponseEnvelope "Commission rules retrieved successfully."
// @Failure 404 {object} httpx.ErrorResponse "Commission plan not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/commission-plans/{id}/rules [get]
func (h CommissionHandler) ListRules(c fiber.Ctx) error {
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
	rules, err := h.svc.ListRulesByPlan(c, plan.ID)
	if err != nil {
		httpx.RequestLog(c).Error("commission rules list failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve commission rules.", err)
	}
	items := make([]CommissionRuleResponse, len(rules))
	for i, rule := range rules {
		items[i] = newCommissionRuleResponse(rule)
	}
	return httpx.CreateSuccessResponse(c, "Commission rules retrieved successfully.", ListCommissionRulesResponse{
		CommissionRules: items,
	})
}

type CreateCommissionRuleRequest struct {
	ItemCategoryID *uint64 `json:"item_category_id"`
	MinAmount      float64 `json:"min_amount"`
	MaxAmount      float64 `json:"max_amount"`
	RatePct        float64 `json:"rate_pct"`
	FixedAmount    float64 `json:"fixed_amount"`
}

type CreateCommissionRuleResponse struct {
	CommissionRule CommissionRuleResponse `json:"commission_rule"`
}

type CreateCommissionRuleResponseEnvelope struct {
	httpx.EnvelopeBase
	Data CreateCommissionRuleResponse `json:"data"`
}

// @Summary Create commission rule
// @Description Adds a commission rule to a plan. A rule pays either a percentage of the base amount or a fixed amount, optionally limited by item category and amount range.
// @Tags Commissions
// @Accept json
// @Produce json
// @Param id path integer true "Commission plan ID"
// @Param body body CreateCommissionRuleRequest true "Commission rule details"
// @Success 201 {object} CreateCommissionRuleResponseEnvelope "Commission rule created successfully."
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/commission-plans/{id}/rules [post]
func (h CommissionHandler) CreateRule(c fiber.Ctx) error {
	var request CreateCommissionRuleRequest
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
	created, err := h.svc.CreateRule(c, commission.CreateRuleRequest{
		PlanID:         plan.ID,
		ItemCategoryID: request.ItemCategoryID,
		MinAmount:      request.MinAmount,
		MaxAmount:      request.MaxAmount,
		RatePct:        request.RatePct,
		FixedAmount:    request.FixedAmount,
	})
	if err != nil {
		return writeCommissionError(c, err)
	}
	return httpx.CreateCreatedResponse(c, "Commission rule created successfully.", CreateCommissionRuleResponse{
		CommissionRule: newCommissionRuleResponse(created),
	})
}
