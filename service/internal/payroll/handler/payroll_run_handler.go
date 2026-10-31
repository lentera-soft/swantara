package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/payroll"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type PayrollRunHandler struct {
	svc payroll.PayrollService
}

func NewPayrollRunHandler(svc payroll.PayrollService) PayrollRunHandler {
	return PayrollRunHandler{svc: svc}
}

func (h PayrollRunHandler) ensureRunInOrg(c fiber.Ctx, runID uint64) error {
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	run, err := h.svc.FindRunInOrg(c, runID, organizationID)
	if err != nil {
		return writePayrollError(c, err)
	}
	if run == nil {
		return httpx.CreateNotFoundResponse(c, "Payroll run not found.")
	}
	return nil
}

type PayrollRunResponse struct {
	ID             uint64  `json:"id"`
	OrganizationID uint64  `json:"organization_id"`
	Name           *string `json:"name"`
	PeriodStart    string  `json:"period_start"`
	PeriodEnd      string  `json:"period_end"`
	State          string  `json:"state"`
}

func newPayrollRunResponse(run *payroll.PayrollRun) PayrollRunResponse {
	return PayrollRunResponse{
		ID:             run.ID,
		OrganizationID: run.OrganizationID,
		Name:           run.Name,
		PeriodStart:    run.PeriodStart.Format("2006-01-02"),
		PeriodEnd:      run.PeriodEnd.Format("2006-01-02"),
		State:          run.State,
	}
}

type CreatePayrollRunRequest struct {
	OrganizationID uint64 `json:"organization_id" validate:"required,gt=0"`
	PeriodStart    string `json:"period_start" validate:"required"`
	PeriodEnd      string `json:"period_end" validate:"required"`
}

type ListPayrollRunsResponseEnvelope struct {
	httpx.EnvelopeBase
	Data []PayrollRunResponse `json:"data"`
}

type PayrollRunResponseEnvelope struct {
	httpx.EnvelopeBase
	Data PayrollRunResponse `json:"data"`
}

type PayrollRunDetailResponseEnvelope struct {
	httpx.EnvelopeBase
	Data PayrollRunDetailResponse `json:"data"`
}

var payrollRunQueryAllowlist = map[string]struct{}{
	"organization_id": {},
	"name":            {},
	"state":           {},
	"period_start":    {},
	"period_end":      {},
}

// @Summary List payroll runs
// @Description Lists payroll runs with pagination, sorting, and filtering, scoped to the caller's organization. Queries are restricted to an allowlisted set of fields, and the organization filter is forced to the caller's tenant so cross-tenant payroll runs are never returned.
// @Tags Payroll Runs
// @Accept json
// @Produce json
// @Param page query integer false "Page number" default(1)
// @Param size query integer false "Items per page (max 100)" default(20)
// @Param sort query string false "Sort fields (comma separated)"
// @Param filter query string false "Filters (repeatable)"
// @Success 200 {object} ListPayrollRunsResponseEnvelope "Payroll runs retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 422 {object} httpx.ErrorResponse "Invalid query parameters"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/payroll-runs [get]
func (h PayrollRunHandler) List(c fiber.Ctx) error {
	parsedQuery, err := httpx.ParseQueryParams(c, payrollRunQueryAllowlist)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid query parameters.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	page, err := h.svc.ListRunsInOrg(c, parsedQuery, organizationID)
	if err != nil {
		httpx.RequestLog(c).Error("payroll run list failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve payroll runs.", err)
	}
	items := make([]PayrollRunResponse, len(page.Items))
	for i, run := range page.Items {
		items[i] = newPayrollRunResponse(run)
	}
	return httpx.CreateSuccessResponseWithMeta(c, "Payroll runs retrieved successfully.", items, httpx.BuildListMeta(parsedQuery, page.Count))
}

// @Summary Get payroll run
// @Description Gets a single payroll run by its id along with its payslips and their line items. The payroll run must belong to the caller's organization (404 otherwise), and payslips are only loaded for the retrieved run.
// @Tags Payroll Runs
// @Accept json
// @Produce json
// @Param id path integer true "Payroll run ID"
// @Success 200 {object} PayrollRunDetailResponseEnvelope "Payroll run retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Payroll run not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/payroll-runs/{id} [get]
func (h PayrollRunHandler) Get(c fiber.Ctx) error {
	runID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid payroll run id provided.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	run, err := h.svc.FindRunInOrg(c, runID, organizationID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "Payroll run not found.")
		}
		httpx.RequestLog(c).Error("payroll run lookup failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to get payroll run.", err)
	}
	if run == nil {
		return httpx.CreateNotFoundResponse(c, "Payroll run not found.")
	}
	payslips, err := h.svc.ListPayslipsByRun(c, runID)
	if err != nil {
		httpx.RequestLog(c).Error("payslip lookup failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to get payslips.", err)
	}
	payslipItems := make([]PayslipResponse, len(payslips))
	for i, payslip := range payslips {
		lines, err := h.svc.ListPayslipLines(c, payslip.ID)
		if err != nil {
			httpx.RequestLog(c).Error("payslip line lookup failed", "error", err)
			return httpx.CreateInternalServerErrorResponse(c, "Failed to get payslip lines.", err)
		}
		payslipItems[i] = newPayslipResponse(payslip, lines)
	}
	return httpx.CreateSuccessResponse(c, "Payroll run retrieved successfully.", PayrollRunDetailResponse{
		Run:      newPayrollRunResponse(run),
		Payslips: payslipItems,
	})
}

type PayrollRunDetailResponse struct {
	Run      PayrollRunResponse `json:"run"`
	Payslips []PayslipResponse  `json:"payslips"`
}

// @Summary Create payroll run
// @Description Creates a new draft payroll run for a pay period, computing and storing payslips for every active employee with an active employment contract. Period dates must be in YYYY-MM-DD format with period_start on or before period_end, and a 422 response is returned when no eligible employees are found.
// @Tags Payroll Runs
// @Accept json
// @Produce json
// @Param request body CreatePayrollRunRequest true "Payroll run details"
// @Success 201 {object} PayrollRunResponseEnvelope "Payroll run created successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Resource not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/payroll-runs [post]
func (h PayrollRunHandler) Create(c fiber.Ctx) error {
	var request CreatePayrollRunRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	periodStart, err := helper.ParseDate(&request.PeriodStart)
	if err != nil || periodStart == nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Period start must be in YYYY-MM-DD format.", nil)
	}
	periodEnd, err := helper.ParseDate(&request.PeriodEnd)
	if err != nil || periodEnd == nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Period end must be in YYYY-MM-DD format.", nil)
	}
	run, err := h.svc.CreateRun(c, payroll.CreateRunRequest{
		OrganizationID: organizationID,
		PeriodStart:    *periodStart,
		PeriodEnd:      *periodEnd,
	})
	if err != nil {
		return writePayrollError(c, err)
	}
	return httpx.CreateCreatedResponse(c, "Payroll run created successfully.", newPayrollRunResponse(run))
}

type ConfirmPayrollRunRequest struct {
	JournalID uint64 `json:"journal_id" validate:"required,gt=0"`
	Date      string `json:"date" validate:"required"`
}

// @Summary Confirm payroll run
// @Description Confirms a draft payroll run, posting the payroll accrual journal entries to each salary rule's debit and credit accounts across all payslips. The run must be in draft state, the journal must exist, and the date must be in YYYY-MM-DD format; on success the run movements to confirmed and its payslips to posted.
// @Tags Payroll Runs
// @Accept json
// @Produce json
// @Param id path integer true "Payroll run ID"
// @Param request body ConfirmPayrollRunRequest true "Journal and date details"
// @Success 200 {object} PayrollRunResponseEnvelope "Payroll run confirmed successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Resource not found"
// @Failure 422 {object} httpx.ErrorResponse "Payroll cannot be processed"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/payroll-runs/{id}/confirm [post]
func (h PayrollRunHandler) Confirm(c fiber.Ctx) error {
	runID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid payroll run id provided.", nil)
	}
	var request ConfirmPayrollRunRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	date, err := helper.ParseDate(&request.Date)
	if err != nil || date == nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Date must be in YYYY-MM-DD format.", nil)
	}
	if err := h.ensureRunInOrg(c, runID); err != nil {
		return err
	}
	run, err := h.svc.Confirm(c, runID, request.JournalID, *date)
	if err != nil {
		return writePayrollError(c, err)
	}
	return httpx.CreateSuccessResponse(c, "Payroll run confirmed successfully.", newPayrollRunResponse(run))
}

type PayPayrollRunRequest struct {
	JournalID           uint64 `json:"journal_id" validate:"required,gt=0"`
	NetPayableAccountID uint64 `json:"net_payable_account_id" validate:"required,gt=0"`
	Date                string `json:"date" validate:"required"`
}

// @Summary Pay payroll run
// @Description Marks a confirmed payroll run as paid, posting a payment journal entry that debits the given net payable account and credits the bank account linked to the journal. The run must be in confirmed state, the journal must define a bank account, and the combined net pay of all payslips must be positive; on success the run movements to paid.
// @Tags Payroll Runs
// @Accept json
// @Produce json
// @Param id path integer true "Payroll run ID"
// @Param request body PayPayrollRunRequest true "Journal, net payable account and date details"
// @Success 200 {object} PayrollRunResponseEnvelope "Payroll run paid successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Resource not found"
// @Failure 422 {object} httpx.ErrorResponse "Payroll cannot be processed"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/payroll-runs/{id}/pay [post]
func (h PayrollRunHandler) Pay(c fiber.Ctx) error {
	runID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid payroll run id provided.", nil)
	}
	var request PayPayrollRunRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	date, err := helper.ParseDate(&request.Date)
	if err != nil || date == nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Date must be in YYYY-MM-DD format.", nil)
	}
	if err := h.ensureRunInOrg(c, runID); err != nil {
		return err
	}
	run, err := h.svc.Pay(c, runID, request.JournalID, request.NetPayableAccountID, *date)
	if err != nil {
		return writePayrollError(c, err)
	}
	return httpx.CreateSuccessResponse(c, "Payroll run paid successfully.", newPayrollRunResponse(run))
}

// @Summary Close payroll run
// @Description Closes a paid payroll run, finalizing the pay period and moving the run to closed state. Only runs in paid state can be closed, and attempting to close a run in any other state returns a 422 response.
// @Tags Payroll Runs
// @Accept json
// @Produce json
// @Param id path integer true "Payroll run ID"
// @Success 200 {object} PayrollRunResponseEnvelope "Payroll run closed successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Resource not found"
// @Failure 422 {object} httpx.ErrorResponse "Payroll cannot be processed"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/payroll-runs/{id}/close [post]
func (h PayrollRunHandler) Close(c fiber.Ctx) error {
	runID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid payroll run id provided.", nil)
	}
	if err := h.ensureRunInOrg(c, runID); err != nil {
		return err
	}
	run, err := h.svc.Close(c, runID)
	if err != nil {
		return writePayrollError(c, err)
	}
	return httpx.CreateSuccessResponse(c, "Payroll run closed successfully.", newPayrollRunResponse(run))
}
