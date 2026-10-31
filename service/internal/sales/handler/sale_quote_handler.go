package handler

import (
	"context"
	"errors"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/sales"
)

type SaleQuoteHandler struct {
	svc sales.SaleQuoteService
}

func NewSaleQuoteHandler(svc sales.SaleQuoteService) SaleQuoteHandler {
	return SaleQuoteHandler{svc: svc}
}

type SaleQuoteResponse struct {
	ID              uint64                  `json:"id"`
	OrganizationID  *uint64                 `json:"organization_id"`
	Name            *string                 `json:"name"`
	ContactID       uint64                  `json:"contact_id"`
	PriceBookID     *uint64                 `json:"price_book_id"`
	CurrencyCode    *string                 `json:"currency_code"`
	SalespersonID   *uint64                 `json:"salesperson_id"`
	SalesGroupID    *uint64                 `json:"sales_group_id"`
	ProspectID      *uint64                 `json:"prospect_id"`
	State           string                  `json:"state"`
	QuoteDate       *time.Time              `json:"quote_date"`
	ValidityDate    *time.Time              `json:"validity_date"`
	PaymentTermID   *uint64                 `json:"payment_term_id"`
	Incoterm        *string                 `json:"incoterm"`
	CustomerPORef   *string                 `json:"customer_po_ref"`
	AmountUntaxed   float64                 `json:"amount_untaxed"`
	AmountTax       float64                 `json:"amount_tax"`
	AmountTotal     float64                 `json:"amount_total"`
	ExpectedRevenue *float64                `json:"expected_revenue"`
	Version         int                     `json:"version"`
	RootQuoteID     *uint64                 `json:"root_quote_id"`
	PreviousQuoteID *uint64                 `json:"previous_quote_id"`
	IsCurrent       bool                    `json:"is_current"`
	AcceptedAt      *time.Time              `json:"accepted_at"`
	SaleOrderID     *uint64                 `json:"sale_order_id"`
	Note            *string                 `json:"note"`
	Lines           []SaleQuoteLineResponse `json:"lines,omitempty"`
	CreatedAt       time.Time               `json:"created_at"`
	UpdatedAt       time.Time               `json:"updated_at"`
}

type SaleQuoteLineResponse struct {
	ID            uint64            `json:"id"`
	QuoteID       uint64            `json:"quote_id"`
	Sequence      int               `json:"sequence"`
	ItemID        *uint64           `json:"item_id"`
	Description   *string           `json:"description"`
	Qty           float64           `json:"qty"`
	UnitID        *uint64           `json:"unit_id"`
	UnitPrice     float64           `json:"unit_price"`
	DiscountPct   float64           `json:"discount_pct"`
	TaxIDs        helper.Int64Array `json:"tax_ids"`
	DimensionID   *uint64           `json:"dimension_id"`
	PriceSubtotal float64           `json:"price_subtotal"`
	PriceTax      float64           `json:"price_tax"`
	PriceTotal    float64           `json:"price_total"`
}

func newSaleQuoteResponse(quote *sales.SaleQuote) SaleQuoteResponse {
	return SaleQuoteResponse{
		ID:              quote.ID,
		OrganizationID:  quote.OrganizationID,
		Name:            quote.Name,
		ContactID:       quote.ContactID,
		PriceBookID:     quote.PriceBookID,
		CurrencyCode:    quote.CurrencyCode,
		SalespersonID:   quote.SalespersonID,
		SalesGroupID:    quote.SalesGroupID,
		ProspectID:      quote.ProspectID,
		State:           quote.State,
		QuoteDate:       quote.QuoteDate,
		ValidityDate:    quote.ValidityDate,
		PaymentTermID:   quote.PaymentTermID,
		Incoterm:        quote.Incoterm,
		CustomerPORef:   quote.CustomerPORef,
		AmountUntaxed:   quote.AmountUntaxed,
		AmountTax:       quote.AmountTax,
		AmountTotal:     quote.AmountTotal,
		ExpectedRevenue: quote.ExpectedRevenue,
		Version:         quote.Version,
		RootQuoteID:     quote.RootQuoteID,
		PreviousQuoteID: quote.PreviousQuoteID,
		IsCurrent:       quote.IsCurrent,
		AcceptedAt:      quote.AcceptedAt,
		SaleOrderID:     quote.SaleOrderID,
		Note:            quote.Note,
		CreatedAt:       quote.CreatedAt,
		UpdatedAt:       quote.UpdatedAt,
	}
}

func newSaleQuoteLineResponse(line *sales.SaleQuoteLine) SaleQuoteLineResponse {
	return SaleQuoteLineResponse{
		ID:            line.ID,
		QuoteID:       line.QuoteID,
		Sequence:      line.Sequence,
		ItemID:        line.ItemID,
		Description:   line.Description,
		Qty:           line.Qty,
		UnitID:        line.UnitID,
		UnitPrice:     line.UnitPrice,
		DiscountPct:   line.DiscountPct,
		TaxIDs:        line.TaxIDs,
		DimensionID:   line.DimensionID,
		PriceSubtotal: line.PriceSubtotal,
		PriceTax:      line.PriceTax,
		PriceTotal:    line.PriceTotal,
	}
}

var saleQuoteQueryAllowlist = map[string]struct{}{
	"organization_id": {},
	"name":            {},
	"contact_id":      {},
	"state":           {},
	"price_book_id":   {},
	"salesperson_id":  {},
	"sales_group_id":  {},
	"prospect_id":     {},
	"quote_date":      {},
	"validity_date":   {},
	"amount_untaxed":  {},
	"amount_tax":      {},
	"amount_total":    {},
	"version":         {},
	"is_current":      {},
	"created_at":      {},
	"updated_at":      {},
}

type ListSaleQuotesResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ListSaleQuotesResponse `json:"data"`
}
type ListSaleQuotesResponse struct {
	Quotes []SaleQuoteResponse `json:"quotes"`
}

// @Summary List sale quotes
// @Description Lists sale quotes with pagination, sorting, and filtering, scoped to the caller's organization.
// @Tags Sale Quotes
// @Accept json
// @Produce json
// @Param page query integer false "Page number" default(1)
// @Param size query integer false "Items per page (max 100)" default(20)
// @Param sort query string false "Sort fields (comma separated, e.g. name:asc)"
// @Param filter query string false "Filters (repeatable, e.g. state:eq:draft)"
// @Param format query string false "Response format" Enums(json, xml, csv)
// @Success 200 {object} ListSaleQuotesResponseEnvelope "Sale quotes retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 422 {object} httpx.ErrorResponse "Invalid query parameters"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/sale-quotes [get]
func (h SaleQuoteHandler) List(c fiber.Ctx) error {
	parsedQuery, err := httpx.ParseQueryParams(c, saleQuoteQueryAllowlist)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid query parameters.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	page, err := h.svc.ListInOrg(c, parsedQuery, organizationID)
	if err != nil {
		httpx.RequestLog(c).Error("sale quote list failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve sale quotes.", err)
	}

	items := make([]SaleQuoteResponse, len(page.Items))
	for i, quote := range page.Items {
		items[i] = newSaleQuoteResponse(quote)
	}

	if httpx.RequestFormat(c) == httpx.FormatCSV {
		return httpx.ExportCSV(c, fiber.StatusOK, "sale-quotes.csv", items)
	}

	return httpx.CreateSuccessResponseWithMeta(c, "Sale quotes retrieved successfully.", ListSaleQuotesResponse{
		Quotes: items,
	}, httpx.BuildListMeta(parsedQuery, page.Count))
}

type GetSaleQuoteResponseEnvelope struct {
	httpx.EnvelopeBase
	Data GetSaleQuoteResponse `json:"data"`
}
type GetSaleQuoteResponse struct {
	Quote SaleQuoteResponse `json:"quote"`
}

// @Summary Get sale quote
// @Description Gets a single sale quote by id together with its lines.
// @Tags Sale Quotes
// @Accept json
// @Produce json
// @Param id path integer true "Sale quote ID"
// @Success 200 {object} GetSaleQuoteResponseEnvelope "Sale quote retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Sale quote not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/sale-quotes/{id} [get]
func (h SaleQuoteHandler) Get(c fiber.Ctx) error {
	quoteID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid sale quote id provided.", nil)
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	quote, err := h.svc.FindInOrg(c, quoteID, organizationID)
	if err != nil {
		if errors.Is(err, sales.ErrQuoteNotFound) {
			return httpx.CreateNotFoundResponse(c, "Sale quote not found.")
		}
		httpx.RequestLog(c).Error("sale quote lookup failed", "quote_id", quoteID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to get sale quote.", err)
	}

	lines, err := h.svc.ListLines(c, quoteID)
	if err != nil {
		httpx.RequestLog(c).Error("sale quote line list failed", "quote_id", quoteID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to get sale quote.", err)
	}

	response := newSaleQuoteResponse(quote)
	response.Lines = make([]SaleQuoteLineResponse, len(lines))
	for i, line := range lines {
		response.Lines[i] = newSaleQuoteLineResponse(line)
	}

	return httpx.CreateSuccessResponse(c, "Sale quote retrieved successfully.", GetSaleQuoteResponse{
		Quote: response,
	})
}

type SaleQuoteLineRequest struct {
	Sequence    int               `json:"sequence"`
	ItemID      *uint64           `json:"item_id" validate:"required"`
	Description *string           `json:"description"`
	Qty         float64           `json:"qty" validate:"required,gt=0"`
	UnitID      *uint64           `json:"unit_id"`
	UnitPrice   float64           `json:"unit_price"`
	DiscountPct float64           `json:"discount_pct"`
	TaxIDs      helper.Int64Array `json:"tax_ids"`
	DimensionID *uint64           `json:"dimension_id"`
}

type CreateSaleQuoteRequest struct {
	OrganizationID *uint64                `json:"organization_id"`
	ContactID      uint64                 `json:"contact_id"`
	PriceBookID    *uint64                `json:"price_book_id" validate:"required"`
	SalespersonID  *uint64                `json:"salesperson_id"`
	SalesGroupID   *uint64                `json:"sales_group_id"`
	ProspectID     *uint64                `json:"prospect_id"`
	QuoteDate      *string                `json:"quote_date"`
	ValidityDate   *string                `json:"validity_date"`
	PaymentTermID  *uint64                `json:"payment_term_id"`
	Incoterm       *string                `json:"incoterm"`
	CustomerPORef  *string                `json:"customer_po_ref"`
	Note           *string                `json:"note"`
	Lines          []SaleQuoteLineRequest `json:"lines"`
}

type CreateSaleQuoteResponseEnvelope struct {
	httpx.EnvelopeBase
	Data CreateSaleQuoteResponse `json:"data"`
}
type CreateSaleQuoteResponse struct {
	Quote SaleQuoteResponse `json:"quote"`
}

// @Summary Create sale quote
// @Description Creates a draft sale quote with its lines. Prices default to the price book when a line omits the unit price.
// @Tags Sale Quotes
// @Accept json
// @Produce json
// @Param body body CreateSaleQuoteRequest true "Sale quote details"
// @Success 201 {object} CreateSaleQuoteResponseEnvelope "Sale quote created successfully."
// @Failure 400 {object} httpx.ErrorResponse "Bad request"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 422 {object} httpx.ErrorResponse "Validation error or unknown reference"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/sale-quotes [post]
func (h SaleQuoteHandler) Create(c fiber.Ctx) error {
	var request CreateSaleQuoteRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}

	quoteDate, validityDate, err := parseQuoteDates(request.QuoteDate, request.ValidityDate)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid quote date provided.", nil)
	}

	quote, err := h.svc.Create(c, &sales.SaleQuote{
		OrganizationID: httpx.TenantOrganizationID(c, request.OrganizationID),
		ContactID:      request.ContactID,
		PriceBookID:    request.PriceBookID,
		SalespersonID:  request.SalespersonID,
		SalesGroupID:   request.SalesGroupID,
		ProspectID:     request.ProspectID,
		QuoteDate:      quoteDate,
		ValidityDate:   validityDate,
		PaymentTermID:  request.PaymentTermID,
		Incoterm:       request.Incoterm,
		CustomerPORef:  request.CustomerPORef,
		Note:           request.Note,
	}, saleQuoteLines(request.Lines))
	if err != nil {
		return writeSaleQuoteError(c, err)
	}

	return httpx.CreateCreatedResponse(c, "Sale quote created successfully.", CreateSaleQuoteResponse{
		Quote: newSaleQuoteResponse(quote),
	})
}

type UpdateSaleQuoteRequest struct {
	OrganizationID *uint64                `json:"organization_id"`
	ContactID      uint64                 `json:"contact_id" validate:"required,gt=0"`
	PriceBookID    *uint64                `json:"price_book_id" validate:"required"`
	SalespersonID  *uint64                `json:"salesperson_id"`
	SalesGroupID   *uint64                `json:"sales_group_id"`
	ProspectID     *uint64                `json:"prospect_id"`
	QuoteDate      *string                `json:"quote_date"`
	ValidityDate   *string                `json:"validity_date"`
	PaymentTermID  *uint64                `json:"payment_term_id"`
	Incoterm       *string                `json:"incoterm"`
	CustomerPORef  *string                `json:"customer_po_ref"`
	Note           *string                `json:"note"`
	Lines          []SaleQuoteLineRequest `json:"lines"`
}

type UpdateSaleQuoteResponseEnvelope struct {
	httpx.EnvelopeBase
	Data UpdateSaleQuoteResponse `json:"data"`
}
type UpdateSaleQuoteResponse struct {
	Quote SaleQuoteResponse `json:"quote"`
}

// @Summary Update draft sale quote
// @Description Updates a draft sale quote by replacing its lines and recomputing amounts.
// @Tags Sale Quotes
// @Accept json
// @Produce json
// @Param id path integer true "Sale quote ID"
// @Param body body UpdateSaleQuoteRequest true "Sale quote details"
// @Success 200 {object} UpdateSaleQuoteResponseEnvelope "Sale quote updated successfully."
// @Failure 400 {object} httpx.ErrorResponse "Bad request"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Sale quote not found"
// @Failure 409 {object} httpx.ErrorResponse "Sale quote is not in draft state"
// @Failure 422 {object} httpx.ErrorResponse "Validation error or unknown reference"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/sale-quotes/{id} [put]
func (h SaleQuoteHandler) Update(c fiber.Ctx) error {
	quoteID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid sale quote id provided.", nil)
	}

	var request UpdateSaleQuoteRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	existing, err := h.svc.FindInOrg(c, quoteID, organizationID)
	if err != nil {
		if errors.Is(err, sales.ErrQuoteNotFound) {
			return httpx.CreateNotFoundResponse(c, "Sale quote not found.")
		}
		httpx.RequestLog(c).Error("sale quote lookup failed", "quote_id", quoteID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to update sale quote.", err)
	}

	quoteDate, validityDate, err := parseQuoteDates(request.QuoteDate, request.ValidityDate)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid quote date provided.", nil)
	}

	updated, err := h.svc.UpdateDraft(c, quoteID, &sales.SaleQuote{
		OrganizationID: httpx.TenantOrganizationID(c, existing.OrganizationID),
		ContactID:      request.ContactID,
		PriceBookID:    request.PriceBookID,
		SalespersonID:  request.SalespersonID,
		SalesGroupID:   request.SalesGroupID,
		ProspectID:     request.ProspectID,
		QuoteDate:      quoteDate,
		ValidityDate:   validityDate,
		PaymentTermID:  request.PaymentTermID,
		Incoterm:       request.Incoterm,
		CustomerPORef:  request.CustomerPORef,
		Note:           request.Note,
	}, saleQuoteLines(request.Lines))
	if err != nil {
		return writeSaleQuoteError(c, err)
	}

	return httpx.CreateSuccessResponse(c, "Sale quote updated successfully.", UpdateSaleQuoteResponse{
		Quote: newSaleQuoteResponse(updated),
	})
}

// @Summary Delete sale quote
// @Description Permanently deletes a sale quote by id.
// @Tags Sale Quotes
// @Accept json
// @Produce json
// @Param id path integer true "Sale quote ID"
// @Success 204 "No Content"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Sale quote not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/sale-quotes/{id} [delete]
func (h SaleQuoteHandler) Delete(c fiber.Ctx) error {
	quoteID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid sale quote id provided.", nil)
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	if _, err := h.svc.FindInOrg(c, quoteID, organizationID); err != nil {
		if errors.Is(err, sales.ErrQuoteNotFound) {
			return httpx.CreateNotFoundResponse(c, "Sale quote not found.")
		}
		httpx.RequestLog(c).Error("sale quote lookup failed", "quote_id", quoteID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to delete sale quote.", err)
	}

	if err := h.svc.Delete(c, quoteID); err != nil {
		httpx.RequestLog(c).Error("sale quote deletion failed", "quote_id", quoteID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to delete sale quote.", err)
	}

	return httpx.CreateNoContentResponse(c)
}

type SaleQuoteTransitionResponseEnvelope struct {
	httpx.EnvelopeBase
	Data SaleQuoteTransitionResponse `json:"data"`
}
type SaleQuoteTransitionResponse struct {
	Quote SaleQuoteResponse `json:"quote"`
}

func (h SaleQuoteHandler) transition(c fiber.Ctx, action string, fn func(context.Context, uint64) (*sales.SaleQuote, error)) error {
	quoteID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid sale quote id provided.", nil)
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	if _, err := h.svc.FindInOrg(c, quoteID, organizationID); err != nil {
		if errors.Is(err, sales.ErrQuoteNotFound) {
			return httpx.CreateNotFoundResponse(c, "Sale quote not found.")
		}
		httpx.RequestLog(c).Error("sale quote lookup failed", "quote_id", quoteID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to update sale quote.", err)
	}

	actorID, _ := httpx.CallerID(c)
	quote, err := fn(model.ContextWithActor(c, actorID), quoteID)
	if err != nil {
		return writeSaleQuoteError(c, err)
	}

	return httpx.CreateSuccessResponse(c, "Sale quote "+action+" successfully.", SaleQuoteTransitionResponse{
		Quote: newSaleQuoteResponse(quote),
	})
}

// @Summary Send sale quote
// @Description Moves a draft sale quote to sent so it can be accepted or expired.
// @Tags Sale Quotes
// @Produce json
// @Param id path integer true "Sale quote ID"
// @Success 200 {object} SaleQuoteTransitionResponseEnvelope "Sale quote sent successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Sale quote not found"
// @Failure 409 {object} httpx.ErrorResponse "Sale quote cannot be sent in its current state"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/sale-quotes/{id}/send [post]
func (h SaleQuoteHandler) Send(c fiber.Ctx) error {
	return h.transition(c, "sent", func(ctx context.Context, id uint64) (*sales.SaleQuote, error) {
		return h.svc.Send(ctx, id)
	})
}

// @Summary Accept sale quote
// @Description Accepts a sent, unexpired sale quote so it can be converted to a sale order.
// @Tags Sale Quotes
// @Produce json
// @Param id path integer true "Sale quote ID"
// @Success 200 {object} SaleQuoteTransitionResponseEnvelope "Sale quote accepted successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Sale quote not found"
// @Failure 409 {object} httpx.ErrorResponse "Sale quote cannot be accepted in its current state"
// @Failure 422 {object} httpx.ErrorResponse "Sale quote has expired"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/sale-quotes/{id}/accept [post]
func (h SaleQuoteHandler) Accept(c fiber.Ctx) error {
	return h.transition(c, "accepted", func(ctx context.Context, id uint64) (*sales.SaleQuote, error) {
		return h.svc.Accept(ctx, id)
	})
}

// @Summary Cancel sale quote
// @Description Cancels a draft or sent sale quote.
// @Tags Sale Quotes
// @Produce json
// @Param id path integer true "Sale quote ID"
// @Success 200 {object} SaleQuoteTransitionResponseEnvelope "Sale quote cancelled successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Sale quote not found"
// @Failure 409 {object} httpx.ErrorResponse "Sale quote cannot be cancelled in its current state"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/sale-quotes/{id}/cancel [post]
func (h SaleQuoteHandler) Cancel(c fiber.Ctx) error {
	return h.transition(c, "cancelled", func(ctx context.Context, id uint64) (*sales.SaleQuote, error) {
		return h.svc.Cancel(ctx, id)
	})
}

// @Summary Expire sale quote
// @Description Marks a sent sale quote as expired.
// @Tags Sale Quotes
// @Produce json
// @Param id path integer true "Sale quote ID"
// @Success 200 {object} SaleQuoteTransitionResponseEnvelope "Sale quote expired successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Sale quote not found"
// @Failure 409 {object} httpx.ErrorResponse "Sale quote cannot be expired in its current state"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/sale-quotes/{id}/expire [post]
func (h SaleQuoteHandler) Expire(c fiber.Ctx) error {
	return h.transition(c, "expired", func(ctx context.Context, id uint64) (*sales.SaleQuote, error) {
		return h.svc.Expire(ctx, id)
	})
}

type ReviseSaleQuoteRequest struct {
	OrganizationID *uint64                `json:"organization_id"`
	ContactID      uint64                 `json:"contact_id"`
	PriceBookID    *uint64                `json:"price_book_id"`
	SalespersonID  *uint64                `json:"salesperson_id"`
	SalesGroupID   *uint64                `json:"sales_group_id"`
	ProspectID     *uint64                `json:"prospect_id"`
	QuoteDate      *string                `json:"quote_date"`
	ValidityDate   *string                `json:"validity_date"`
	PaymentTermID  *uint64                `json:"payment_term_id"`
	Incoterm       *string                `json:"incoterm"`
	CustomerPORef  *string                `json:"customer_po_ref"`
	Note           *string                `json:"note"`
	Lines          []SaleQuoteLineRequest `json:"lines"`
}

type ReviseSaleQuoteResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ReviseSaleQuoteResponse `json:"data"`
}
type ReviseSaleQuoteResponse struct {
	Quote SaleQuoteResponse `json:"quote"`
}

// @Summary Revise sale quote
// @Description Creates a new version of a current, non-accepted sale quote and keeps the prior revision in history.
// @Tags Sale Quotes
// @Accept json
// @Produce json
// @Param id path integer true "Sale quote ID"
// @Param body body ReviseSaleQuoteRequest true "Revised sale quote details"
// @Success 201 {object} ReviseSaleQuoteResponseEnvelope "Sale quote revised successfully."
// @Failure 400 {object} httpx.ErrorResponse "Bad request"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Sale quote not found"
// @Failure 409 {object} httpx.ErrorResponse "Sale quote cannot be revised in its current state"
// @Failure 422 {object} httpx.ErrorResponse "Validation error or unknown reference"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/sale-quotes/{id}/revise [post]
func (h SaleQuoteHandler) Revise(c fiber.Ctx) error {
	quoteID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid sale quote id provided.", nil)
	}

	var request ReviseSaleQuoteRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	existing, err := h.svc.FindInOrg(c, quoteID, organizationID)
	if err != nil {
		if errors.Is(err, sales.ErrQuoteNotFound) {
			return httpx.CreateNotFoundResponse(c, "Sale quote not found.")
		}
		httpx.RequestLog(c).Error("sale quote lookup failed", "quote_id", quoteID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to revise sale quote.", err)
	}

	quoteDate, validityDate, err := parseQuoteDates(request.QuoteDate, request.ValidityDate)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid quote date provided.", nil)
	}

	revised, err := h.svc.Revise(c, quoteID, &sales.SaleQuote{
		OrganizationID: httpx.TenantOrganizationID(c, existing.OrganizationID),
		ContactID:      request.ContactID,
		PriceBookID:    request.PriceBookID,
		SalespersonID:  request.SalespersonID,
		SalesGroupID:   request.SalesGroupID,
		ProspectID:     request.ProspectID,
		QuoteDate:      quoteDate,
		ValidityDate:   validityDate,
		PaymentTermID:  request.PaymentTermID,
		Incoterm:       request.Incoterm,
		CustomerPORef:  request.CustomerPORef,
		Note:           request.Note,
	}, saleQuoteLines(request.Lines))
	if err != nil {
		return writeSaleQuoteError(c, err)
	}

	return httpx.CreateCreatedResponse(c, "Sale quote revised successfully.", ReviseSaleQuoteResponse{
		Quote: newSaleQuoteResponse(revised),
	})
}

type SaleQuoteHistoryResponseEnvelope struct {
	httpx.EnvelopeBase
	Data SaleQuoteHistoryResponse `json:"data"`
}
type SaleQuoteHistoryResponse struct {
	Quotes []SaleQuoteResponse `json:"quotes"`
}

// @Summary List sale quote history
// @Description Lists every version of a sale quote, oldest first, including the accepted version marker.
// @Tags Sale Quotes
// @Produce json
// @Param id path integer true "Sale quote ID"
// @Success 200 {object} SaleQuoteHistoryResponseEnvelope "Sale quote history retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Sale quote not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/sale-quotes/{id}/history [get]
func (h SaleQuoteHandler) History(c fiber.Ctx) error {
	quoteID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid sale quote id provided.", nil)
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	if _, err := h.svc.FindInOrg(c, quoteID, organizationID); err != nil {
		if errors.Is(err, sales.ErrQuoteNotFound) {
			return httpx.CreateNotFoundResponse(c, "Sale quote not found.")
		}
		httpx.RequestLog(c).Error("sale quote lookup failed", "quote_id", quoteID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to get sale quote history.", err)
	}

	history, err := h.svc.ListHistory(c, quoteID)
	if err != nil {
		httpx.RequestLog(c).Error("sale quote history failed", "quote_id", quoteID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to get sale quote history.", err)
	}

	items := make([]SaleQuoteResponse, len(history))
	for i, quote := range history {
		items[i] = newSaleQuoteResponse(quote)
	}

	return httpx.CreateSuccessResponse(c, "Sale quote history retrieved successfully.", SaleQuoteHistoryResponse{
		Quotes: items,
	})
}

func saleQuoteLines(requests []SaleQuoteLineRequest) []*sales.SaleQuoteLine {
	lines := make([]*sales.SaleQuoteLine, len(requests))
	for i, line := range requests {
		lines[i] = &sales.SaleQuoteLine{
			Sequence:    line.Sequence,
			ItemID:      line.ItemID,
			Description: line.Description,
			Qty:         line.Qty,
			UnitID:      line.UnitID,
			UnitPrice:   line.UnitPrice,
			DiscountPct: line.DiscountPct,
			TaxIDs:      line.TaxIDs,
			DimensionID: line.DimensionID,
		}
	}
	return lines
}

func parseQuoteDates(quoteDate, validityDate *string) (*time.Time, *time.Time, error) {
	parsedQuoteDate, err := helper.ParseDate(quoteDate)
	if err != nil {
		return nil, nil, err
	}
	parsedValidityDate, err := helper.ParseDate(validityDate)
	if err != nil {
		return nil, nil, err
	}
	return parsedQuoteDate, parsedValidityDate, nil
}

func writeSaleQuoteError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "sale quote write failed", "Failed to process sale quote.",
		httpx.NotFound(sales.ErrQuoteNotFound, "Sale quote not found."),
		httpx.Unprocessable(sales.ErrQuoteSequenceNotFound, "Sale quote document sequence is not configured."),
		httpx.Conflict(sales.ErrQuoteState, "Sale quote cannot be processed in its current state."),
		httpx.Conflict(sales.ErrQuoteExpired, "Sale quote has expired."),
		httpx.Conflict(sales.ErrSalesCreditLimit, "Sale exceeds the customer credit limit and needs an approved sales approval request."),
		httpx.Conflict(sales.ErrSalesApprovalRequired, "Sale requires approval but no sales approvers are configured."),
		httpx.Conflict(sales.ErrSalesApprovalPending, "Sale is waiting for approval. Retry after the request is approved."),
		httpx.Conflict(sales.ErrSalesApprovalRefused, "Sale approval request was refused. Resolve the approval and retry."),
		httpx.Unprocessable(sales.ErrQuoteNoLines, "Sale quote must have at least one line."),
		httpx.Unprocessable(sales.ErrQuoteQty, "Sale quote line quantity must be positive."),
		httpx.Unprocessable(sales.ErrQuoteDiscount, "Sale quote line discount must be between 0 and 100."),
		httpx.Unprocessable(sales.ErrQuoteContact, "Sale quote contact does not exist."),
		httpx.Unprocessable(sales.ErrQuotePriceBook, "Sale quote price_book does not exist."),
		httpx.Unprocessable(sales.ErrQuoteContactOrganization, "Sale quote contact does not belong to this organization."),
		httpx.Unprocessable(sales.ErrQuotePriceBookOrganization, "Sale quote price_book does not belong to this organization."),
		httpx.Unprocessable(sales.ErrQuoteVariant, "Sale quote item variant does not exist."),
		httpx.Unprocessable(sales.ErrQuoteVariantOrganization, "Sale quote line item does not belong to this organization."),
		httpx.Unprocessable(sales.ErrQuoteLead, "Sale quote source opportunity does not exist."),
		httpx.Unprocessable(sales.ErrQuoteLeadInvalid, "Sale quote source must be an opportunity."),
		httpx.Conflict(sales.ErrQuoteLeadClosed, "Sale quote source opportunity is lost or closed."),
		httpx.Unprocessable(sales.ErrQuoteLeadOrganization, "Sale quote source opportunity does not belong to this organization."),
		httpx.Unprocessable(sales.ErrQuoteTax, "Sale quote tax does not exist."),
		httpx.Unprocessable(sales.ErrQuoteTaxInvalid, "Sale quote tax is not a sale tax."),
		httpx.Unprocessable(sales.ErrQuoteTaxOrganization, "Sale quote tax does not belong to this organization."),
		httpx.Unprocessable(sales.ErrQuoteNotAccepted, "Sale quote must be accepted before conversion."),
		httpx.Conflict(sales.ErrQuoteAlreadyConverted, "Sale quote has already been converted to an order."),
	)
}
