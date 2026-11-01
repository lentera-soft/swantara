package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/expense"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

// @Summary Submit expense report
// @Description Transitions a draft expense report into the submitted state for approval.
// @Tags Expense
// @Accept json
// @Produce json
// @Param id path integer true "Expense report ID"
// @Success 200 {object} TransitionExpenseReportResponseEnvelope "Expense report submitted successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Expense report not found"
// @Failure 409 {object} httpx.ErrorResponse "Expense report state is invalid for this operation"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/expense-reports/{id}/submit [post]
func (h ExpenseReportHandler) Submit(c fiber.Ctx) error {
	return h.transition(c, func(c fiber.Ctx, organizationID, reportID, actorID uint64) (*expense.ExpenseReport, error) {
		return h.svc.Submit(c, organizationID, reportID)
	})
}

// @Summary Approve expense report
// @Description Approves a submitted expense report, allowing it to be posted.
// @Tags Expense
// @Accept json
// @Produce json
// @Param id path integer true "Expense report ID"
// @Success 200 {object} TransitionExpenseReportResponseEnvelope "Expense report approved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Expense report not found"
// @Failure 409 {object} httpx.ErrorResponse "Expense report state is invalid for this operation"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/expense-reports/{id}/approve [post]
func (h ExpenseReportHandler) Approve(c fiber.Ctx) error {
	return h.transition(c, func(c fiber.Ctx, organizationID, reportID, actorID uint64) (*expense.ExpenseReport, error) {
		return h.svc.Approve(c, organizationID, reportID, actorID)
	})
}

// @Summary Reject expense report
// @Description Rejects a submitted expense report, preventing posting.
// @Tags Expense
// @Accept json
// @Produce json
// @Param id path integer true "Expense report ID"
// @Success 200 {object} TransitionExpenseReportResponseEnvelope "Expense report refused successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Expense report not found"
// @Failure 409 {object} httpx.ErrorResponse "Expense report state is invalid for this operation"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/expense-reports/{id}/reject [post]
func (h ExpenseReportHandler) Refuse(c fiber.Ctx) error {
	return h.transition(c, func(c fiber.Ctx, organizationID, reportID, actorID uint64) (*expense.ExpenseReport, error) {
		return h.svc.Refuse(c, organizationID, reportID)
	})
}

// @Summary Post expense report
// @Description Posts an approved expense report to the general ledger, recording expense, input tax, and payable or card clearing accounts.
// @Tags Expense
// @Accept json
// @Produce json
// @Param id path integer true "Expense report ID"
// @Success 200 {object} TransitionExpenseReportResponseEnvelope "Expense report posted successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Expense report not found"
// @Failure 409 {object} httpx.ErrorResponse "Expense report state is invalid for this operation"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/expense-reports/{id}/post [post]
func (h ExpenseReportHandler) Post(c fiber.Ctx) error {
	return h.transition(c, func(c fiber.Ctx, organizationID, reportID, actorID uint64) (*expense.ExpenseReport, error) {
		return h.svc.Post(c, organizationID, reportID)
	})
}

// @Summary Reimburse expense report
// @Description Reimburses a posted own-account expense report, clearing the employee payable against the bank.
// @Tags Expense
// @Accept json
// @Produce json
// @Param id path integer true "Expense report ID"
// @Success 200 {object} TransitionExpenseReportResponseEnvelope "Expense report reimbursed successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Expense report not found"
// @Failure 409 {object} httpx.ErrorResponse "Expense report state is invalid for this operation"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/expense-reports/{id}/reimburse [post]
func (h ExpenseReportHandler) Reimburse(c fiber.Ctx) error {
	return h.transition(c, func(c fiber.Ctx, organizationID, reportID, actorID uint64) (*expense.ExpenseReport, error) {
		return h.svc.Reimburse(c, organizationID, reportID)
	})
}

// @Summary Invoice expense report
// @Description Creates a customer invoice from the billable lines of a posted expense report.
// @Tags Expense
// @Accept json
// @Produce json
// @Param id path integer true "Expense report ID"
// @Success 201 {object} BillExpenseReportResponseEnvelope "Expense report billed successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Expense report not found"
// @Failure 409 {object} httpx.ErrorResponse "Expense report state is invalid for this operation"
// @Failure 422 {object} httpx.ErrorResponse "Expense report has no billable lines"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/expense-reports/{id}/invoice [post]
func (h ExpenseReportHandler) Bill(c fiber.Ctx) error {
	organizationID := httpx.TenantOrganizationID(c, nil)
	if organizationID == nil {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	reportID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid expense report id provided.", nil)
	}

	invoice, err := h.svc.BillToInvoice(c, *organizationID, reportID)
	if err != nil {
		return writeExpenseError(c, err)
	}

	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateCreatedResponse(c, "Expense report billed successfully.", BillExpenseReportResponseEnvelope{
		Data: BillExpenseReportResponse{InvoiceID: invoice.ID},
	})
}

func (h ExpenseReportHandler) transition(c fiber.Ctx, transition func(c fiber.Ctx, organizationID, reportID, actorID uint64) (*expense.ExpenseReport, error)) error {
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	actorID, ok := httpx.CallerID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingUserInContext)
	}

	reportID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid expense report id provided.", nil)
	}

	updated, err := transition(c, organizationID, reportID, actorID)
	if err != nil {
		return writeExpenseError(c, err)
	}

	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "Expense report updated successfully.", TransitionExpenseReportResponseEnvelope{
		Data: newExpenseReportResponse(updated),
	})
}

func writeExpenseError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "expense report write failed", "Failed to save expense report.",
		httpx.NotFound(expense.ErrExpenseReportNotFound, "Expense report not found."),
		httpx.Conflict(expense.ErrExpenseReportState, "Expense report state is invalid for this operation."),
		httpx.Unprocessable(expense.ErrExpenseNoLines, "Expense report must have at least one line."),
		httpx.Unprocessable(expense.ErrExpenseNoCategory, "Expense line category does not exist."),
		httpx.Unprocessable(expense.ErrExpenseNoAccount, "Expense category has no expense account configured."),
		httpx.Unprocessable(expense.ErrExpenseConfig, "Expense posting is not configured for this organization."),
		httpx.Unprocessable(expense.ErrExpenseNoBillable, "Expense report has no billable lines."),
		httpx.Unprocessable(expense.ErrExpenseBillableProject, "Billable expense lines must reference a single project."),
		httpx.Unprocessable(expense.ErrExpenseProjectNotFound, "Billable expense project does not exist."),
		httpx.Unprocessable(expense.ErrExpenseNoIncomeAccount, "Billable expense lines require a item with an income account."),
		httpx.Unprocessable(expense.ErrExpenseInvalidLine, "Expense report has invalid data."),
	)
}
