package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

var purchaseMemoQueryAllowlist = map[string]struct{}{
	"order_id":     {},
	"journal_id":   {},
	"contact_id":   {},
	"state":        {},
	"date":         {},
	"amount_total": {},
	"created_at":   {},
	"updated_at":   {},
}

type ListCreditMemosResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ListCreditMemosResponse `json:"data"`
}

type ListCreditMemosResponse struct {
	CreditMemos []CreditMemoResponse `json:"credit_memos"`
}

// @Summary List purchase credit memos
// @Description Lists the supplier credit memos recorded against a purchase order, with pagination, sorting, and filtering.
// @Tags Purchase Orders
// @Accept json
// @Produce json
// @Param id path integer true "Purchase order ID"
// @Param page query integer false "Page number" default(1)
// @Param size query integer false "Items per page (max 100)" default(20)
// @Param sort query string false "Sort fields (comma separated, e.g. created_at:desc)"
// @Param filter query string false "Filters (repeatable, e.g. state:eq:posted)"
// @Param format query string false "Response format" Enums(json, xml, csv)
// @Success 200 {object} ListCreditMemosResponseEnvelope "Credit memos retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Purchase order not found"
// @Failure 422 {object} httpx.ErrorResponse "Invalid id or query parameters"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/purchase-orders/{id}/credit-memos [get]
func (h PurchaseOrderHandler) ListCreditMemos(c fiber.Ctx) error {
	orderID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid purchase order id provided.", nil)
	}
	parsedQuery, err := httpx.ParseQueryParams(c, purchaseMemoQueryAllowlist)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid query parameters.", nil)
	}

	page, err := h.svc.ListCreditMemos(c, orderID, parsedQuery)
	if err != nil {
		return writePurchaseOrderError(c, err)
	}

	items := make([]CreditMemoResponse, len(page.Items))
	for i, memo := range page.Items {
		items[i] = newCreditMemoResponse(memo)
	}

	if httpx.RequestFormat(c) == httpx.FormatCSV {
		httpx.RequestLog(c).Info("operation completed")
		return httpx.ExportCSV(c, fiber.StatusOK, "purchase-credit-memos.csv", items)
	}

	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponseWithMeta(c, "Credit memos retrieved successfully.", ListCreditMemosResponse{
		CreditMemos: items,
	}, httpx.BuildListMeta(parsedQuery, page.Count))
}

type GetCreditMemoResponseEnvelope struct {
	httpx.EnvelopeBase
	Data GetCreditMemoResponse `json:"data"`
}

type GetCreditMemoResponse struct {
	Memo CreditMemoResponse `json:"memo"`
}

// @Summary Get purchase credit memo
// @Description Returns a single supplier credit memo by id.
// @Tags Purchase Orders
// @Accept json
// @Produce json
// @Param id path integer true "Purchase order ID"
// @Param memo_id path integer true "Credit memo ID"
// @Success 200 {object} GetCreditMemoResponseEnvelope "Credit memo retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Purchase order or credit memo not found"
// @Failure 422 {object} httpx.ErrorResponse "Invalid id"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/purchase-orders/{id}/credit-memos/{memo_id} [get]
func (h PurchaseOrderHandler) GetCreditMemo(c fiber.Ctx) error {
	orderID, memoID, ok := parseMemoPathIDs(c)
	if !ok {
		return nil
	}
	memo, err := h.svc.FindCreditMemo(c, orderID, memoID)
	if err != nil {
		return writePurchaseOrderError(c, err)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "Credit memo retrieved successfully.", GetCreditMemoResponse{
		Memo: newCreditMemoResponse(memo),
	})
}

type ListDebitMemosResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ListDebitMemosResponse `json:"data"`
}

type ListDebitMemosResponse struct {
	DebitMemos []DebitMemoResponse `json:"debit_memos"`
}

// @Summary List purchase debit memos
// @Description Lists the supplier debit memos recorded against a purchase order, with pagination, sorting, and filtering.
// @Tags Purchase Orders
// @Accept json
// @Produce json
// @Param id path integer true "Purchase order ID"
// @Param page query integer false "Page number" default(1)
// @Param size query integer false "Items per page (max 100)" default(20)
// @Param sort query string false "Sort fields (comma separated, e.g. created_at:desc)"
// @Param filter query string false "Filters (repeatable, e.g. state:eq:posted)"
// @Param format query string false "Response format" Enums(json, xml, csv)
// @Success 200 {object} ListDebitMemosResponseEnvelope "Debit memos retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Purchase order not found"
// @Failure 422 {object} httpx.ErrorResponse "Invalid id or query parameters"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/purchase-orders/{id}/debit-memos [get]
func (h PurchaseOrderHandler) ListDebitMemos(c fiber.Ctx) error {
	orderID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid purchase order id provided.", nil)
	}
	parsedQuery, err := httpx.ParseQueryParams(c, purchaseMemoQueryAllowlist)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid query parameters.", nil)
	}

	page, err := h.svc.ListDebitMemos(c, orderID, parsedQuery)
	if err != nil {
		return writePurchaseOrderError(c, err)
	}

	items := make([]DebitMemoResponse, len(page.Items))
	for i, memo := range page.Items {
		items[i] = newDebitMemoResponse(memo)
	}

	if httpx.RequestFormat(c) == httpx.FormatCSV {
		httpx.RequestLog(c).Info("operation completed")
		return httpx.ExportCSV(c, fiber.StatusOK, "purchase-debit-memos.csv", items)
	}

	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponseWithMeta(c, "Debit memos retrieved successfully.", ListDebitMemosResponse{
		DebitMemos: items,
	}, httpx.BuildListMeta(parsedQuery, page.Count))
}

type GetDebitMemoResponseEnvelope struct {
	httpx.EnvelopeBase
	Data GetDebitMemoResponse `json:"data"`
}

type GetDebitMemoResponse struct {
	Memo DebitMemoResponse `json:"memo"`
}

// @Summary Get purchase debit memo
// @Description Returns a single supplier debit memo by id.
// @Tags Purchase Orders
// @Accept json
// @Produce json
// @Param id path integer true "Purchase order ID"
// @Param memo_id path integer true "Debit memo ID"
// @Success 200 {object} GetDebitMemoResponseEnvelope "Debit memo retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Purchase order or debit memo not found"
// @Failure 422 {object} httpx.ErrorResponse "Invalid id"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/purchase-orders/{id}/debit-memos/{memo_id} [get]
func (h PurchaseOrderHandler) GetDebitMemo(c fiber.Ctx) error {
	orderID, memoID, ok := parseMemoPathIDs(c)
	if !ok {
		return nil
	}
	memo, err := h.svc.FindDebitMemo(c, orderID, memoID)
	if err != nil {
		return writePurchaseOrderError(c, err)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "Debit memo retrieved successfully.", GetDebitMemoResponse{
		Memo: newDebitMemoResponse(memo),
	})
}

func parseMemoPathIDs(c fiber.Ctx) (uint64, uint64, bool) {
	orderID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		_ = httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid purchase order id provided.", nil)
		return 0, 0, false
	}
	memoID, err := strconv.ParseUint(c.Params("memo_id"), 10, 64)
	if err != nil {
		_ = httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid memo id provided.", nil)
		return 0, 0, false
	}
	return orderID, memoID, true
}
