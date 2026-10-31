package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/payroll"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type PayslipHandler struct {
	svc payroll.PayrollService
}

func NewPayslipHandler(svc payroll.PayrollService) PayslipHandler {
	return PayslipHandler{svc: svc}
}

type PayslipLineResponse struct {
	ID        uint64  `json:"id"`
	PayslipID uint64  `json:"payslip_id"`
	RuleID    uint64  `json:"rule_id"`
	Code      string  `json:"code"`
	Name      string  `json:"name"`
	Category  string  `json:"category"`
	Amount    float64 `json:"amount"`
}

func newPayslipLineResponse(line *payroll.PayslipLine) PayslipLineResponse {
	return PayslipLineResponse{
		ID:        line.ID,
		PayslipID: line.PayslipID,
		RuleID:    line.RuleID,
		Code:      line.Code,
		Name:      line.Name,
		Category:  line.Category,
		Amount:    line.Amount,
	}
}

type PayslipResponse struct {
	ID         uint64                `json:"id"`
	RunID      uint64                `json:"run_id"`
	EmployeeID uint64                `json:"employee_id"`
	ContractID uint64                `json:"contract_id"`
	Gross      float64               `json:"gross"`
	Net        float64               `json:"net"`
	EntryID    *uint64               `json:"entry_id"`
	State      string                `json:"state"`
	Lines      []PayslipLineResponse `json:"lines"`
}

func newPayslipResponse(payslip *payroll.Payslip, lines []*payroll.PayslipLine) PayslipResponse {
	lineItems := make([]PayslipLineResponse, len(lines))
	for i, line := range lines {
		lineItems[i] = newPayslipLineResponse(line)
	}
	return PayslipResponse{
		ID:         payslip.ID,
		RunID:      payslip.RunID,
		EmployeeID: payslip.EmployeeID,
		ContractID: payslip.ContractID,
		Gross:      payslip.Gross,
		Net:        payslip.Net,
		EntryID:    payslip.EntryID,
		State:      payslip.State,
		Lines:      lineItems,
	}
}

type ListPayslipsResponseEnvelope struct {
	httpx.EnvelopeBase
	Data []PayslipResponse `json:"data"`
}

type PayslipResponseEnvelope struct {
	httpx.EnvelopeBase
	Data PayslipResponse `json:"data"`
}

var payslipQueryAllowlist = map[string]struct{}{
	"run_id":      {},
	"employee_id": {},
	"state":       {},
}

// @Summary List payslips
// @Description Lists payslips with pagination, sorting, and filtering, including each payslip's line items. Queries are restricted to allowlisted fields (run, employee, and state), and invalid query parameters return a 422 response.
// @Tags Payslips
// @Accept json
// @Produce json
// @Param page query integer false "Page number" default(1)
// @Param size query integer false "Items per page (max 100)" default(20)
// @Param sort query string false "Sort fields (comma separated)"
// @Param filter query string false "Filters (repeatable)"
// @Success 200 {object} ListPayslipsResponseEnvelope "Payslips retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 422 {object} httpx.ErrorResponse "Invalid query parameters"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/payslips [get]
func (h PayslipHandler) List(c fiber.Ctx) error {
	parsedQuery, err := httpx.ParseQueryParams(c, payslipQueryAllowlist)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid query parameters.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	page, err := h.svc.ListPayslipsInOrg(c, parsedQuery, organizationID)
	if err != nil {
		httpx.RequestLog(c).Error("payslip list failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve payslips.", err)
	}
	items := make([]PayslipResponse, len(page.Items))
	for i, payslip := range page.Items {
		lines, err := h.svc.ListPayslipLines(c, payslip.ID)
		if err != nil {
			httpx.RequestLog(c).Error("payslip line lookup failed", "error", err)
			return httpx.CreateInternalServerErrorResponse(c, "Failed to get payslip lines.", err)
		}
		items[i] = newPayslipResponse(payslip, lines)
	}
	return httpx.CreateSuccessResponseWithMeta(c, "Payslips retrieved successfully.", items, httpx.BuildListMeta(parsedQuery, page.Count))
}

// @Summary Get payslip
// @Description Gets a single payslip by its id along with its line items. The id must be a valid positive integer, and a 404 response is returned when no matching payslip exists.
// @Tags Payslips
// @Accept json
// @Produce json
// @Param id path integer true "Payslip ID"
// @Success 200 {object} PayslipResponseEnvelope "Payslip retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Payslip not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/payslips/{id} [get]
func (h PayslipHandler) Get(c fiber.Ctx) error {
	payslipID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid payslip id provided.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	payslip, err := h.svc.FindPayslipInOrg(c, payslipID, organizationID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "Payslip not found.")
		}
		httpx.RequestLog(c).Error("payslip lookup failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to get payslip.", err)
	}
	if payslip == nil {
		return httpx.CreateNotFoundResponse(c, "Payslip not found.")
	}
	lines, err := h.svc.ListPayslipLines(c, payslip.ID)
	if err != nil {
		httpx.RequestLog(c).Error("payslip line lookup failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to get payslip lines.", err)
	}
	return httpx.CreateSuccessResponse(c, "Payslip retrieved successfully.", newPayslipResponse(payslip, lines))
}
