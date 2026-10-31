package handler

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/commission"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

type CommissionEntryResponse struct {
	ID               uint64  `json:"id"`
	SalespersonID    uint64  `json:"salesperson_id"`
	PlanID           uint64  `json:"plan_id"`
	SourceType       string  `json:"source_type"`
	SourceID         uint64  `json:"source_id"`
	BaseAmount       float64 `json:"base_amount"`
	CommissionAmount float64 `json:"commission_amount"`
	State            string  `json:"state"`
	PeriodID         *uint64 `json:"period_id"`
	PayslipID        *uint64 `json:"payslip_id"`
}

func newCommissionEntryResponse(e *commission.CommissionEntry) CommissionEntryResponse {
	return CommissionEntryResponse{
		ID: e.ID, SalespersonID: e.SalespersonID, PlanID: e.PlanID,
		SourceType: e.SourceType, SourceID: e.SourceID, BaseAmount: e.BaseAmount,
		CommissionAmount: e.CommissionAmount, State: e.State, PeriodID: e.PeriodID, PayslipID: e.PayslipID,
	}
}

var commissionEntryQueryAllowlist = map[string]struct{}{
	"salesperson_id": {},
	"plan_id":        {},
	"state":          {},
	"source_type":    {},
	"source_id":      {},
	"period_id":      {},
	"created_at":     {},
	"updated_at":     {},
}

type ListCommissionEntriesResponse struct {
	CommissionEntries []CommissionEntryResponse `json:"commission_entries"`
}

type ListCommissionEntriesResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ListCommissionEntriesResponse `json:"data"`
}

// @Summary List commission entries
// @Description Lists accrued commission entries with pagination, sorting, and filtering.
// @Tags Commissions
// @Accept json
// @Produce json
// @Success 200 {object} ListCommissionEntriesResponseEnvelope "Commission entries retrieved successfully."
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/commission-entries [get]
func (h CommissionHandler) ListEntries(c fiber.Ctx) error {
	parsedQuery, err := httpx.ParseQueryParams(c, commissionEntryQueryAllowlist)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid query parameters.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	page, err := h.svc.ListEntriesInOrg(c, parsedQuery, organizationID)
	if err != nil {
		httpx.RequestLog(c).Error("commission entries list failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve commission entries.", err)
	}
	items := make([]CommissionEntryResponse, len(page.Items))
	for i, entry := range page.Items {
		items[i] = newCommissionEntryResponse(entry)
	}
	return httpx.CreateSuccessResponseWithMeta(c, "Commission entries retrieved successfully.", ListCommissionEntriesResponse{
		CommissionEntries: items,
	}, httpx.BuildListMeta(parsedQuery, page.Count))
}

type AccrueCommissionRequest struct {
	SalespersonID    uint64  `json:"salesperson_id" validate:"required,gt=0"`
	PlanID           uint64  `json:"plan_id" validate:"required,gt=0"`
	SourceType       string  `json:"source_type" validate:"required"`
	SourceID         uint64  `json:"source_id" validate:"required,gt=0"`
	ItemCategoryID   *uint64 `json:"item_category_id"`
	BaseAmount       float64 `json:"base_amount" validate:"required,gt=0"`
	JournalID        uint64  `json:"journal_id" validate:"required,gt=0"`
	ExpenseAccountID uint64  `json:"expense_account_id" validate:"required,gt=0"`
	PayableAccountID uint64  `json:"payable_account_id" validate:"required,gt=0"`
	Date             string  `json:"date"`
	PeriodID         *uint64 `json:"period_id"`
}

type AccrueCommissionResponse struct {
	CommissionEntry CommissionEntryResponse `json:"commission_entry"`
}

type AccrueCommissionResponseEnvelope struct {
	httpx.EnvelopeBase
	Data AccrueCommissionResponse `json:"data"`
}

// @Summary Accrue commission entry
// @Description Computes the commission from the plan's matching rule and posts Dr Commission Expense / Cr Commission Payable, recording a confirmed entry.
// @Tags Commissions
// @Accept json
// @Produce json
// @Param body body AccrueCommissionRequest true "Accrual details"
// @Success 201 {object} AccrueCommissionResponseEnvelope "Commission entry accrued successfully."
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/commission-entries/accrue [post]
func (h CommissionHandler) Accrue(c fiber.Ctx) error {
	var request AccrueCommissionRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	date := time.Time{}
	if request.Date != "" {
		parsed, err := helper.ParseDateStr(request.Date)
		if err != nil {
			return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid date.", nil)
		}
		date = parsed
	}
	created, err := h.svc.Accrue(c, commission.AccrueRequest{
		OrganizationID:   organizationID,
		SalespersonID:    request.SalespersonID,
		PlanID:           request.PlanID,
		SourceType:       request.SourceType,
		SourceID:         request.SourceID,
		ItemCategoryID:   request.ItemCategoryID,
		BaseAmount:       request.BaseAmount,
		JournalID:        request.JournalID,
		ExpenseAccountID: request.ExpenseAccountID,
		PayableAccountID: request.PayableAccountID,
		Date:             date,
		PeriodID:         request.PeriodID,
	})
	if err != nil {
		return writeCommissionError(c, err)
	}
	return httpx.CreateCreatedResponse(c, "Commission entry accrued successfully.", AccrueCommissionResponse{
		CommissionEntry: newCommissionEntryResponse(created),
	})
}

type AccrueFromInvoiceCommissionRequest struct {
	InvoiceID        uint64  `json:"invoice_id" validate:"required,gt=0"`
	SalespersonID    uint64  `json:"salesperson_id" validate:"required,gt=0"`
	JournalID        uint64  `json:"journal_id" validate:"required,gt=0"`
	ExpenseAccountID uint64  `json:"expense_account_id" validate:"required,gt=0"`
	PayableAccountID uint64  `json:"payable_account_id" validate:"required,gt=0"`
	Date             string  `json:"date"`
	PeriodID         *uint64 `json:"period_id"`
}

type AccrueFromInvoiceCommissionResponse struct {
	CommissionEntry CommissionEntryResponse `json:"commission_entry"`
}

type AccrueFromInvoiceCommissionResponseEnvelope struct {
	httpx.EnvelopeBase
	Data AccrueFromInvoiceCommissionResponse `json:"data"`
}

// @Summary Accrue commission from invoice
// @Description Derives the commission base from a live invoice per the plan basis (revenue, margin, or collected), then accrues Dr Commission Expense / Cr Commission Payable.
// @Tags Commissions
// @Accept json
// @Produce json
// @Param body body AccrueFromInvoiceCommissionRequest true "Accrual details"
// @Success 201 {object} AccrueFromInvoiceCommissionResponseEnvelope "Commission entry accrued successfully."
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/commission-entries/accrue-from-invoice [post]
func (h CommissionHandler) AccrueFromInvoice(c fiber.Ctx) error {
	var request AccrueFromInvoiceCommissionRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	date := time.Time{}
	if request.Date != "" {
		parsed, err := helper.ParseDateStr(request.Date)
		if err != nil {
			return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid date.", nil)
		}
		date = parsed
	}
	created, err := h.svc.AccrueFromInvoice(c, commission.AccrueFromInvoiceRequest{
		OrganizationID:   organizationID,
		InvoiceID:        request.InvoiceID,
		SalespersonID:    request.SalespersonID,
		JournalID:        request.JournalID,
		ExpenseAccountID: request.ExpenseAccountID,
		PayableAccountID: request.PayableAccountID,
		Date:             date,
		PeriodID:         request.PeriodID,
	})
	if err != nil {
		return writeCommissionError(c, err)
	}
	return httpx.CreateCreatedResponse(c, "Commission entry accrued successfully.", AccrueFromInvoiceCommissionResponse{
		CommissionEntry: newCommissionEntryResponse(created),
	})
}

type PayCommissionRequest struct {
	PayslipID *uint64 `json:"payslip_id"`
}

type GetCommissionEntryResponse struct {
	CommissionEntry CommissionEntryResponse `json:"commission_entry"`
}

type GetCommissionEntryResponseEnvelope struct {
	httpx.EnvelopeBase
	Data GetCommissionEntryResponse `json:"data"`
}

// @Summary Settle commission entry
// @Description Marks a confirmed commission entry as paid, optionally linking it to a payslip.
// @Tags Commissions
// @Accept json
// @Produce json
// @Param id path integer true "Commission entry ID"
// @Param body body PayCommissionRequest true "Settlement details"
// @Success 200 {object} GetCommissionEntryResponseEnvelope "Commission entry paid successfully."
// @Failure 422 {object} httpx.ErrorResponse "Entry must be confirmed"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/commission-entries/{id}/pay [post]
func (h CommissionHandler) Pay(c fiber.Ctx) error {
	var request PayCommissionRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	entryID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid id.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	updated, err := h.svc.Pay(c, commission.PayRequest{EntryID: entryID, PayslipID: request.PayslipID}, organizationID)
	if err != nil {
		return writeCommissionError(c, err)
	}
	return httpx.CreateSuccessResponse(c, "Commission entry paid successfully.", GetCommissionEntryResponse{
		CommissionEntry: newCommissionEntryResponse(updated),
	})
}

// @Summary Cancel commission entry
// @Description Cancels a draft or confirmed commission entry.
// @Tags Commissions
// @Accept json
// @Produce json
// @Param id path integer true "Commission entry ID"
// @Success 200 {object} GetCommissionEntryResponseEnvelope "Commission entry cancelled successfully."
// @Failure 422 {object} httpx.ErrorResponse "Entry is not open"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/commission-entries/{id}/cancel [post]
func (h CommissionHandler) Cancel(c fiber.Ctx) error {
	entryID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid id.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	updated, err := h.svc.Cancel(c, entryID, organizationID)
	if err != nil {
		return writeCommissionError(c, err)
	}
	return httpx.CreateSuccessResponse(c, "Commission entry cancelled successfully.", GetCommissionEntryResponse{
		CommissionEntry: newCommissionEntryResponse(updated),
	})
}
