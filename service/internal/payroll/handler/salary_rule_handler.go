package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/payroll"
	"github.com/jalusw/swantara/apps/service/internal/reference"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type SalaryRuleHandler struct {
	svc payroll.SalaryRuleService
}

func NewSalaryRuleHandler(svc payroll.SalaryRuleService) SalaryRuleHandler {
	return SalaryRuleHandler{svc: svc}
}

type SalaryRuleResponse struct {
	ID              uint64   `json:"id"`
	OrganizationID  *uint64  `json:"organization_id"`
	Code            string   `json:"code"`
	Name            string   `json:"name"`
	Category        *string  `json:"category"`
	ComputeType     *string  `json:"compute_type"`
	Amount          *float64 `json:"amount"`
	Formula         *string  `json:"formula"`
	AccountDebitID  *uint64  `json:"account_debit_id"`
	AccountCreditID *uint64  `json:"account_credit_id"`
}

func newSalaryRuleResponse(rule *reference.SalaryRule) SalaryRuleResponse {
	return SalaryRuleResponse{
		ID:              rule.ID,
		OrganizationID:  rule.OrganizationID,
		Code:            rule.Code,
		Name:            rule.Name,
		Category:        rule.Category,
		ComputeType:     rule.ComputeType,
		Amount:          rule.Amount,
		Formula:         rule.Formula,
		AccountDebitID:  rule.AccountDebitID,
		AccountCreditID: rule.AccountCreditID,
	}
}

type CreateSalaryRuleRequest struct {
	OrganizationID  *uint64  `json:"organization_id"`
	Code            string   `json:"code" validate:"required"`
	Name            string   `json:"name" validate:"required"`
	Category        string   `json:"category" validate:"required"`
	ComputeType     string   `json:"compute_type" validate:"required"`
	Amount          *float64 `json:"amount"`
	Formula         *string  `json:"formula"`
	AccountDebitID  *uint64  `json:"account_debit_id" validate:"required,gt=0"`
	AccountCreditID *uint64  `json:"account_credit_id" validate:"required,gt=0"`
}

type ListSalaryRulesResponseEnvelope struct {
	httpx.EnvelopeBase
	Data []SalaryRuleResponse `json:"data"`
}

type SalaryRuleResponseEnvelope struct {
	httpx.EnvelopeBase
	Data SalaryRuleResponse `json:"data"`
}

var salaryRuleQueryAllowlist = map[string]struct{}{
	"code":            {},
	"category":        {},
	"compute_type":    {},
	"organization_id": {},
}

// @Summary List salary rules
// @Description Lists salary rules with pagination, sorting, and filtering, scoped to the caller's organization. Queries are restricted to allowlisted fields (code, category, and compute type), and the organization filter is forced to the caller's tenant so cross-tenant salary rules are never returned.
// @Tags Salary Rules
// @Accept json
// @Produce json
// @Param page query integer false "Page number" default(1)
// @Param size query integer false "Items per page (max 100)" default(20)
// @Param sort query string false "Sort fields (comma separated)"
// @Param filter query string false "Filters (repeatable)"
// @Success 200 {object} ListSalaryRulesResponseEnvelope "Salary rules retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 422 {object} httpx.ErrorResponse "Invalid query parameters"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/salary-rules [get]
func (h SalaryRuleHandler) List(c fiber.Ctx) error {
	parsedQuery, err := httpx.ParseQueryParams(c, salaryRuleQueryAllowlist)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid query parameters.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	page, err := h.svc.ListInOrg(c, parsedQuery, organizationID)
	if err != nil {
		httpx.RequestLog(c).Error("salary rule list failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve salary rules.", err)
	}
	items := make([]SalaryRuleResponse, len(page.Items))
	for i, rule := range page.Items {
		items[i] = newSalaryRuleResponse(rule)
	}
	return httpx.CreateSuccessResponseWithMeta(c, "Salary rules retrieved successfully.", items, httpx.BuildListMeta(parsedQuery, page.Count))
}

// @Summary Get salary rule
// @Description Gets a single salary rule by its id. The salary rule must belong to the caller's organization, and a 404 not found is returned when it does not, even if a salary rule with that id exists in another tenant.
// @Tags Salary Rules
// @Accept json
// @Produce json
// @Param id path integer true "Salary rule ID"
// @Success 200 {object} SalaryRuleResponseEnvelope "Salary rule retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Salary rule not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/salary-rules/{id} [get]
func (h SalaryRuleHandler) Get(c fiber.Ctx) error {
	ruleID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid salary rule id provided.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	rule, err := h.svc.FindInOrg(c, ruleID, organizationID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "Salary rule not found.")
		}
		httpx.RequestLog(c).Error("salary rule lookup failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to get salary rule.", err)
	}
	if rule == nil {
		return httpx.CreateNotFoundResponse(c, "Salary rule not found.")
	}
	return httpx.CreateSuccessResponse(c, "Salary rule retrieved successfully.", newSalaryRuleResponse(rule))
}

// @Summary Create salary rule
// @Description Creates a new salary rule under the caller's organization defining a code, category (earning or deduction), computation type (fixed, percent, or formula), and the debit and credit accounts used when posting payroll. The code, category, and compute type must be valid, and both referenced accounts must exist.
// @Tags Salary Rules
// @Accept json
// @Produce json
// @Param request body CreateSalaryRuleRequest true "Salary rule details"
// @Success 201 {object} SalaryRuleResponseEnvelope "Salary rule created successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/salary-rules [post]
func (h SalaryRuleHandler) Create(c fiber.Ctx) error {
	var request CreateSalaryRuleRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	organizationID := httpx.TenantOrganizationID(c, request.OrganizationID)
	if organizationID == nil {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	rule, err := h.svc.Create(c, &reference.SalaryRule{
		OrganizationID:  organizationID,
		Code:            request.Code,
		Name:            request.Name,
		Category:        helper.Ptr(request.Category),
		ComputeType:     helper.Ptr(request.ComputeType),
		Amount:          request.Amount,
		Formula:         request.Formula,
		AccountDebitID:  request.AccountDebitID,
		AccountCreditID: request.AccountCreditID,
	})
	if err != nil {
		return writePayrollError(c, err)
	}
	return httpx.CreateCreatedResponse(c, "Salary rule created successfully.", newSalaryRuleResponse(rule))
}

type UpdateSalaryRuleRequest struct {
	Code            string   `json:"code" validate:"required"`
	Name            string   `json:"name" validate:"required"`
	Category        string   `json:"category" validate:"required"`
	ComputeType     string   `json:"compute_type" validate:"required"`
	Amount          *float64 `json:"amount"`
	Formula         *string  `json:"formula"`
	AccountDebitID  *uint64  `json:"account_debit_id" validate:"required,gt=0"`
	AccountCreditID *uint64  `json:"account_credit_id" validate:"required,gt=0"`
}

// @Summary Update salary rule
// @Description Updates an existing salary rule's code, category, computation settings, and debit/credit accounts. The salary rule must belong to the caller's organization (404 otherwise), and the same validations applied on creation are enforced on the updated payload.
// @Tags Salary Rules
// @Accept json
// @Produce json
// @Param id path integer true "Salary rule ID"
// @Param request body UpdateSalaryRuleRequest true "Salary rule details"
// @Success 200 {object} SalaryRuleResponseEnvelope "Salary rule updated successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Salary rule not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/salary-rules/{id} [put]
func (h SalaryRuleHandler) Update(c fiber.Ctx) error {
	ruleID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid salary rule id provided.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	rule, err := h.svc.FindInOrg(c, ruleID, organizationID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "Salary rule not found.")
		}
		httpx.RequestLog(c).Error("salary rule lookup failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to get salary rule.", err)
	}
	if rule == nil {
		return httpx.CreateNotFoundResponse(c, "Salary rule not found.")
	}
	var request UpdateSalaryRuleRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	rule.Code = request.Code
	rule.Name = request.Name
	rule.Category = helper.Ptr(request.Category)
	rule.ComputeType = helper.Ptr(request.ComputeType)
	rule.Amount = request.Amount
	rule.Formula = request.Formula
	rule.AccountDebitID = request.AccountDebitID
	rule.AccountCreditID = request.AccountCreditID
	updated, err := h.svc.Update(c, rule)
	if err != nil {
		return writePayrollError(c, err)
	}
	return httpx.CreateSuccessResponse(c, "Salary rule updated successfully.", newSalaryRuleResponse(updated))
}

// @Summary Delete salary rule
// @Description Deletes a salary rule by id. The salary rule must exist within the caller's organization or a 404 response is returned, and a successful deletion returns no content.
// @Tags Salary Rules
// @Accept json
// @Produce json
// @Param id path integer true "Salary rule ID"
// @Success 204 {object} httpx.EmptyEnvelope "Salary rule deleted successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Salary rule not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/salary-rules/{id} [delete]
func (h SalaryRuleHandler) Delete(c fiber.Ctx) error {
	ruleID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid salary rule id provided.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	rule, err := h.svc.FindInOrg(c, ruleID, organizationID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "Salary rule not found.")
		}
		httpx.RequestLog(c).Error("salary rule lookup failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to get salary rule.", err)
	}
	if rule == nil {
		return httpx.CreateNotFoundResponse(c, "Salary rule not found.")
	}
	if err := h.svc.Delete(c, ruleID); err != nil {
		httpx.RequestLog(c).Error("salary rule delete failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to delete salary rule.", err)
	}
	return httpx.CreateNoContentResponse(c)
}
