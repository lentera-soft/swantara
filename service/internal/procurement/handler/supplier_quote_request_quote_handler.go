package handler

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/procurement"
)

type SupplierQuoteLineRequest struct {
	QuoteRequestLineID uint64  `json:"quote_request_line_id" validate:"required,gt=0"`
	ItemID             *uint64 `json:"item_id"`
	Description        *string `json:"description"`
	Qty                float64 `json:"qty" validate:"required,gt=0"`
	UnitPrice          float64 `json:"unit_price" validate:"required"`
	DiscountPct        float64 `json:"discount_pct"`
}

type SubmitSupplierQuoteRequestRequest struct {
	SupplierID   uint64                     `json:"supplier_id" validate:"required,gt=0"`
	CurrencyCode *string                    `json:"currency_code"`
	ValidUntil   *time.Time                 `json:"valid_until"`
	Notes        *string                    `json:"notes"`
	Lines        []SupplierQuoteLineRequest `json:"lines" validate:"required,min=1"`
}

type SupplierQuoteResponse struct {
	ID             uint64     `json:"id"`
	QuoteRequestID uint64     `json:"quote_request_id"`
	SupplierID     uint64     `json:"supplier_id"`
	CurrencyCode   *string    `json:"currency_code"`
	State          string     `json:"state"`
	QuoteDate      *time.Time `json:"quote_date"`
	ValidUntil     *time.Time `json:"valid_until"`
	Notes          *string    `json:"notes"`
	AmountUntaxed  float64    `json:"amount_untaxed"`
	AmountTax      float64    `json:"amount_tax"`
	AmountTotal    float64    `json:"amount_total"`
}

type ListSupplierQuotesResponse struct {
	Quotes []SupplierQuoteResponse `json:"quotes"`
}

type ListSupplierQuotesResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ListSupplierQuotesResponse `json:"data"`
}

type SubmitSupplierQuoteResponse struct {
	Quote SupplierQuoteResponse `json:"quote"`
}

type SubmitSupplierQuoteResponseEnvelope struct {
	httpx.EnvelopeBase
	Data SubmitSupplierQuoteResponse `json:"data"`
}

func newSupplierQuoteResponse(quote *procurement.SupplierQuote) SupplierQuoteResponse {
	return SupplierQuoteResponse{
		ID:             quote.ID,
		QuoteRequestID: quote.QuoteRequestID,
		SupplierID:     quote.SupplierID,
		CurrencyCode:   quote.CurrencyCode,
		State:          quote.State,
		QuoteDate:      quote.QuoteDate,
		ValidUntil:     quote.ValidUntil,
		Notes:          quote.Notes,
		AmountUntaxed:  quote.AmountUntaxed,
		AmountTax:      quote.AmountTax,
		AmountTotal:    quote.AmountTotal,
	}
}

// @Summary Submit Supplier Quotation
// @Description Submits a priced supplier quotation for a sent supplier quote request, creating it in the submitted state. Each line must reference a known supplier quote request line with a positive quantity and a non-negative unit price, and the untaxed and total amounts are computed from the quoted lines. Only sent supplier quote requests can receive quotations, and the submitting supplier must exist.
// @Tags Supplier Quote Requests
// @Accept json
// @Produce json
// @Param id path integer true "Supplier Quote Request ID"
// @Param body body SubmitSupplierQuoteRequestRequest true "Quotation details"
// @Success 201 {object} SubmitSupplierQuoteResponseEnvelope "Supplier quotation submitted successfully."
// @Failure 400 {object} httpx.ErrorResponse "Bad request"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Supplier Quote Request not found"
// @Failure 409 {object} httpx.ErrorResponse "Conflict"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/supplier-quote-requests/{id}/quotes [post]
func (h SupplierQuoteRequestHandler) SubmitQuote(c fiber.Ctx) error {
	quoteRequestID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid supplier quote request id provided.", nil)
	}
	var request SubmitSupplierQuoteRequestRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	lines := make([]*procurement.SupplierQuoteLine, 0, len(request.Lines))
	for _, line := range request.Lines {
		lines = append(lines, &procurement.SupplierQuoteLine{
			QuoteRequestLineID: line.QuoteRequestLineID,
			ItemID:             line.ItemID,
			Description:        line.Description,
			Qty:                line.Qty,
			UnitPrice:          line.UnitPrice,
			DiscountPct:        line.DiscountPct,
		})
	}
	quote, err := h.svc.SubmitQuote(c, quoteRequestID, &procurement.SupplierQuote{
		SupplierID:   request.SupplierID,
		CurrencyCode: request.CurrencyCode,
		ValidUntil:   request.ValidUntil,
		Notes:        request.Notes,
	}, lines)
	if err != nil {
		return writePurchaseOrderError(c, err)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateCreatedResponse(c, "Supplier quotation submitted successfully.", SubmitSupplierQuoteResponse{
		Quote: newSupplierQuoteResponse(quote),
	})
}

// @Summary List Supplier Quotations
// @Description Lists the supplier quotations submitted for a supplier quote request, including supplier, pricing, validity period, and computed totals. The quotations are returned for the supplier quote request identified by the path id.
// @Tags Supplier Quote Requests
// @Accept json
// @Produce json
// @Param id path integer true "Supplier Quote Request ID"
// @Success 200 {object} ListSupplierQuotesResponseEnvelope "Supplier quotations retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Supplier Quote Request not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/supplier-quote-requests/{id}/quotes [get]
func (h SupplierQuoteRequestHandler) ListQuotes(c fiber.Ctx) error {
	quoteRequestID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid supplier quote request id provided.", nil)
	}
	quotes, err := h.svc.ListQuotes(c, quoteRequestID)
	if err != nil {
		return writePurchaseOrderError(c, err)
	}
	items := make([]SupplierQuoteResponse, len(quotes))
	for i, quote := range quotes {
		items[i] = newSupplierQuoteResponse(quote)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "Supplier quotations retrieved successfully.", ListSupplierQuotesResponse{
		Quotes: items,
	})
}

// @Summary Accept Supplier Quotation
// @Description Accepts a submitted quotation for a sent supplier quote request, marking it as the accepted offer while rejecting every other submitted quotation. The supplier quote request is then moved to the done state, making the accepted quotation the winning offer for conversion into a purchase order.
// @Tags Supplier Quote Requests
// @Accept json
// @Produce json
// @Param id path integer true "Supplier Quote Request ID"
// @Param quote_id path integer true "Supplier quotation ID"
// @Success 200 {object} GetSupplierQuoteRequestResponseEnvelope "Supplier quotation accepted successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Supplier quotation not found"
// @Failure 409 {object} httpx.ErrorResponse "Conflict"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/supplier-quote-requests/{id}/quotes/{quote_id}/accept [post]
func (h SupplierQuoteRequestHandler) AcceptQuote(c fiber.Ctx) error {
	quoteID, err := strconv.ParseUint(c.Params("quote_id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid supplier quotation id provided.", nil)
	}
	quoteRequest, err := h.svc.AcceptQuote(c, quoteID)
	if err != nil {
		return writePurchaseOrderError(c, err)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "Supplier quotation accepted successfully.", GetSupplierQuoteRequestResponse{
		QuoteRequest: newSupplierQuoteRequestResponse(quoteRequest),
	})
}
