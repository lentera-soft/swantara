package handler

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/procurement"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type SupplierQuoteRequestHandler struct {
	svc procurement.SupplierQuoteRequestService
}

func NewSupplierQuoteRequestHandler(
	svc procurement.SupplierQuoteRequestService,
) SupplierQuoteRequestHandler {
	return SupplierQuoteRequestHandler{svc: svc}
}

func (h SupplierQuoteRequestHandler) ensureQuoteRequestInOrg(c fiber.Ctx, quoteRequestID uint64) error {
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	quoteRequest, err := h.svc.FindInOrg(c, quoteRequestID, organizationID)
	if err != nil {
		return writePurchaseOrderError(c, err)
	}
	if quoteRequest == nil {
		return httpx.CreateNotFoundResponse(c, "Supplier Quote Request not found.")
	}
	return nil
}

type SupplierQuoteRequestResponse struct {
	ID             uint64     `json:"id"`
	OrganizationID *uint64    `json:"organization_id"`
	Name           *string    `json:"name"`
	RequesterID    uint64     `json:"requester_id"`
	SupplierID     *uint64    `json:"supplier_id"`
	CurrencyCode   *string    `json:"currency_code"`
	State          string     `json:"state"`
	OrderDate      *time.Time `json:"order_date"`
	QuoteDeadline  *time.Time `json:"quote_deadline"`
	Notes          *string    `json:"notes"`
}

func newSupplierQuoteRequestResponse(quoteRequest *procurement.SupplierQuoteRequest) SupplierQuoteRequestResponse {
	return SupplierQuoteRequestResponse{
		ID:             quoteRequest.ID,
		OrganizationID: quoteRequest.OrganizationID,
		Name:           quoteRequest.Name,
		RequesterID:    quoteRequest.RequesterID,
		SupplierID:     quoteRequest.SupplierID,
		CurrencyCode:   quoteRequest.CurrencyCode,
		State:          quoteRequest.State,
		OrderDate:      quoteRequest.OrderDate,
		QuoteDeadline:  quoteRequest.QuoteDeadline,
		Notes:          quoteRequest.Notes,
	}
}

var supplierQuoteRequestQueryAllowlist = map[string]struct{}{
	"organization_id": {},
	"requester_id":    {},
	"supplier_id":     {},
	"state":           {},
	"order_date":      {},
	"created_at":      {},
	"updated_at":      {},
}

type ListSupplierQuoteRequestsResponse struct {
	QuoteRequests []SupplierQuoteRequestResponse `json:"quote_requests"`
}

type ListSupplierQuoteRequestsResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ListSupplierQuoteRequestsResponse `json:"data"`
}

// @Summary List Supplier Quote Requests
// @Description Lists supplier quote requests across the caller's organization with pagination, sorting, and filtering on attributes such as requester, supplier, and state. The result set is always scoped to the caller's organization even when no organization_id is supplied. Returns the matching supplier quote requests together with pagination metadata.
// @Tags Supplier Quote Requests
// @Accept json
// @Produce json
// @Param page query integer false "Page number" default(1)
// @Param size query integer false "Items per page (max 100)" default(20)
// @Param sort query string false "Sort fields (comma separated)"
// @Param filter query string false "Filters (repeatable)"
// @Success 200 {object} ListSupplierQuoteRequestsResponseEnvelope "Supplier Quote Requests retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 422 {object} httpx.ErrorResponse "Invalid query parameters"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/supplier-quote-requests [get]
func (h SupplierQuoteRequestHandler) List(c fiber.Ctx) error {
	parsedQuery, err := httpx.ParseQueryParams(c, supplierQuoteRequestQueryAllowlist)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid query parameters.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	page, err := h.svc.ListInOrg(c, parsedQuery, organizationID)
	if err != nil {
		httpx.RequestLog(c).Error("supplier quote request list failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve supplier quote requests.", err)
	}
	items := make([]SupplierQuoteRequestResponse, len(page.Items))
	for i, quoteRequest := range page.Items {
		items[i] = newSupplierQuoteRequestResponse(quoteRequest)
	}
	return httpx.CreateSuccessResponseWithMeta(c, "Supplier Quote Requests retrieved successfully.", ListSupplierQuoteRequestsResponse{
		QuoteRequests: items,
	}, httpx.BuildListMeta(parsedQuery, page.Count))
}

type GetSupplierQuoteRequestResponse struct {
	QuoteRequest SupplierQuoteRequestResponse `json:"quote_request"`
}

type GetSupplierQuoteRequestResponseEnvelope struct {
	httpx.EnvelopeBase
	Data GetSupplierQuoteRequestResponse `json:"data"`
}

// @Summary Get Supplier Quote Request
// @Description Gets a single supplier quote request by id, scoped to the caller's organization. A 404 is returned when the supplier quote request does not exist or belongs to another tenant.
// @Tags Supplier Quote Requests
// @Accept json
// @Produce json
// @Param id path integer true "Supplier Quote Request ID"
// @Success 200 {object} GetSupplierQuoteRequestResponseEnvelope "Supplier Quote Request retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Supplier Quote Request not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/supplier-quote-requests/{id} [get]
func (h SupplierQuoteRequestHandler) Get(c fiber.Ctx) error {
	quoteRequestID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid supplier quote request id provided.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	quoteRequest, err := h.svc.FindInOrg(c, quoteRequestID, organizationID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "Supplier Quote Request not found.")
		}
		httpx.RequestLog(c).Error("supplier quote request lookup failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to get supplier quote request.", err)
	}
	if quoteRequest == nil {
		return httpx.CreateNotFoundResponse(c, "Supplier Quote Request not found.")
	}
	return httpx.CreateSuccessResponse(c, "Supplier Quote Request retrieved successfully.", GetSupplierQuoteRequestResponse{
		QuoteRequest: newSupplierQuoteRequestResponse(quoteRequest),
	})
}

type SupplierQuoteRequestLineRequest struct {
	ItemID      *uint64    `json:"item_id"`
	Description *string    `json:"description"`
	Qty         float64    `json:"qty" validate:"required,gt=0"`
	UnitID      *uint64    `json:"unit_id"`
	NeededBy    *time.Time `json:"needed_by"`
}

type CreateSupplierQuoteRequestRequest struct {
	OrganizationID *uint64                           `json:"organization_id"`
	RequesterID    uint64                            `json:"requester_id" validate:"required,gt=0"`
	SupplierID     *uint64                           `json:"supplier_id"`
	CurrencyCode   *string                           `json:"currency_code"`
	OrderDate      *time.Time                        `json:"order_date"`
	QuoteDeadline  *time.Time                        `json:"quote_deadline"`
	Notes          *string                           `json:"notes"`
	Lines          []SupplierQuoteRequestLineRequest `json:"lines" validate:"required,min=1"`
}

type CreateSupplierQuoteRequestResponse struct {
	QuoteRequest SupplierQuoteRequestResponse `json:"quote_request"`
}

type CreateSupplierQuoteRequestResponseEnvelope struct {
	httpx.EnvelopeBase
	Data CreateSupplierQuoteRequestResponse `json:"data"`
}

// @Summary Create Supplier Quote Request
// @Description Creates a new draft supplier quote request with its request lines, validating that the requester exists and that every line quantity is positive. A sequence number is generated for the supplier quote request, the currency defaults to IDR, and the supplier quote request is saved in draft state ready to be sent to vendors.
// @Tags Supplier Quote Requests
// @Accept json
// @Produce json
// @Param body body CreateSupplierQuoteRequestRequest true "Supplier Quote Request details"
// @Success 201 {object} CreateSupplierQuoteRequestResponseEnvelope "Supplier Quote Request created successfully."
// @Failure 400 {object} httpx.ErrorResponse "Bad request"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Not found"
// @Failure 409 {object} httpx.ErrorResponse "Conflict"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/supplier-quote-requests [post]
func (h SupplierQuoteRequestHandler) Create(c fiber.Ctx) error {
	var request CreateSupplierQuoteRequestRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	lines := make([]*procurement.SupplierQuoteRequestLine, 0, len(request.Lines))
	for _, line := range request.Lines {
		lines = append(lines, &procurement.SupplierQuoteRequestLine{
			ItemID:      line.ItemID,
			Description: line.Description,
			Qty:         line.Qty,
			UnitID:      line.UnitID,
			NeededBy:    line.NeededBy,
		})
	}
	quoteRequest, err := h.svc.Create(c, &procurement.SupplierQuoteRequest{
		OrganizationID: httpx.TenantOrganizationID(c, request.OrganizationID),
		RequesterID:    request.RequesterID,
		SupplierID:     request.SupplierID,
		CurrencyCode:   request.CurrencyCode,
		OrderDate:      request.OrderDate,
		QuoteDeadline:  request.QuoteDeadline,
		Notes:          request.Notes,
	}, lines)
	if err != nil {
		return writePurchaseOrderError(c, err)
	}
	return httpx.CreateCreatedResponse(c, "Supplier Quote Request created successfully.", CreateSupplierQuoteRequestResponse{
		QuoteRequest: newSupplierQuoteRequestResponse(quoteRequest),
	})
}

type CreateSupplierQuoteRequestFromRequisitionRequest struct {
	RequestID uint64 `json:"request_id" validate:"required,gt=0"`
}

// @Summary Create Supplier Quote Request from Requisition
// @Description Creates a new draft supplier quote request from the lines of an approved purchase requisition, carrying over the requested products, quantities, and needed-by dates. Only requisitions in the approved state can be converted; otherwise the request is rejected with a conflict.
// @Tags Supplier Quote Requests
// @Accept json
// @Produce json
// @Param body body CreateSupplierQuoteRequestFromRequisitionRequest true "Requisition reference"
// @Success 201 {object} CreateSupplierQuoteRequestResponseEnvelope "Supplier Quote Request created from requisition successfully."
// @Failure 400 {object} httpx.ErrorResponse "Bad request"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Not found"
// @Failure 409 {object} httpx.ErrorResponse "Conflict"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/supplier-quote-requests/from-request [post]
func (h SupplierQuoteRequestHandler) CreateFromRequest(c fiber.Ctx) error {
	var request CreateSupplierQuoteRequestFromRequisitionRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	quoteRequest, err := h.svc.CreateFromRequest(c, request.RequestID, &procurement.SupplierQuoteRequest{})
	if err != nil {
		return writePurchaseOrderError(c, err)
	}
	return httpx.CreateCreatedResponse(c, "Supplier Quote Request created from requisition successfully.", CreateSupplierQuoteRequestResponse{
		QuoteRequest: newSupplierQuoteRequestResponse(quoteRequest),
	})
}

// @Summary Send Supplier Quote Request
// @Description Sends a draft supplier quote request, transitioning it to the sent state and opening it for supplier quotations. The state machine rejects the transition from any state other than draft.
// @Tags Supplier Quote Requests
// @Accept json
// @Produce json
// @Param id path integer true "Supplier Quote Request ID"
// @Success 200 {object} GetSupplierQuoteRequestResponseEnvelope "Supplier Quote Request sent successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Supplier Quote Request not found"
// @Failure 409 {object} httpx.ErrorResponse "Conflict"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/supplier-quote-requests/{id}/send [post]
func (h SupplierQuoteRequestHandler) Send(c fiber.Ctx) error {
	quoteRequestID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid supplier quote request id provided.", nil)
	}
	if err := h.ensureQuoteRequestInOrg(c, quoteRequestID); err != nil {
		return err
	}
	quoteRequest, err := h.svc.Send(c, quoteRequestID)
	if err != nil {
		return writePurchaseOrderError(c, err)
	}
	return httpx.CreateSuccessResponse(c, "Supplier Quote Request sent successfully.", GetSupplierQuoteRequestResponse{
		QuoteRequest: newSupplierQuoteRequestResponse(quoteRequest),
	})
}

// @Summary Cancel Supplier Quote Request
// @Description Cancels a draft or sent supplier quote request, moving it to cancelled before it is converted into a purchase order. The state machine rejects cancellation from any state other than draft or sent.
// @Tags Supplier Quote Requests
// @Accept json
// @Produce json
// @Param id path integer true "Supplier Quote Request ID"
// @Success 200 {object} GetSupplierQuoteRequestResponseEnvelope "Supplier Quote Request cancelled successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Supplier Quote Request not found"
// @Failure 409 {object} httpx.ErrorResponse "Conflict"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/supplier-quote-requests/{id}/cancel [post]
func (h SupplierQuoteRequestHandler) Cancel(c fiber.Ctx) error {
	quoteRequestID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid supplier quote request id provided.", nil)
	}
	if err := h.ensureQuoteRequestInOrg(c, quoteRequestID); err != nil {
		return err
	}
	quoteRequest, err := h.svc.Cancel(c, quoteRequestID)
	if err != nil {
		return writePurchaseOrderError(c, err)
	}
	return httpx.CreateSuccessResponse(c, "Supplier Quote Request cancelled successfully.", GetSupplierQuoteRequestResponse{
		QuoteRequest: newSupplierQuoteRequestResponse(quoteRequest),
	})
}
