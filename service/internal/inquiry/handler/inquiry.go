package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/crm"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/inquiry"
)

type ContactInquiryHandler struct {
	svc inquiry.ContactInquiryService
}

func NewContactInquiryHandler(svc inquiry.ContactInquiryService) ContactInquiryHandler {
	return ContactInquiryHandler{svc: svc}
}

var inquiryQueryAllowlist = map[string]struct{}{
	"organization_id": {},
	"prospect_id":     {},
	"name":            {},
	"email":           {},
	"company":         {},
	"status":          {},
	"source":          {},
	"medium":          {},
	"campaign":        {},
	"created_at":      {},
	"updated_at":      {},
}

type CreateContactInquiryRequest struct {
	OrganizationID *uint64 `json:"organization_id"`
	Name           string  `json:"name" validate:"required,max=255"`
	Email          string  `json:"email" validate:"required,email"`
	Company        *string `json:"company" validate:"omitempty,max=255"`
	Message        string  `json:"message" validate:"required,max=5000"`
	Source         *string `json:"source" validate:"omitempty,max=255"`
	Medium         *string `json:"medium" validate:"omitempty,max=255"`
	Campaign       *string `json:"campaign" validate:"omitempty,max=255"`
}

type ContactInquiryResponse struct {
	ID             uint64  `json:"id"`
	OrganizationID *uint64 `json:"organization_id"`
	ProspectID     *uint64 `json:"prospect_id"`
	Name           string  `json:"name"`
	Email          string  `json:"email"`
	Company        *string `json:"company"`
	Message        string  `json:"message"`
	Status         string  `json:"status"`
	Source         *string `json:"source"`
	Medium         *string `json:"medium"`
	Campaign       *string `json:"campaign"`
	CreatedAt      string  `json:"created_at"`
}

type CreateContactInquiryResponse struct {
	Inquiry ContactInquiryResponse `json:"inquiry"`
}

type CreateContactInquiryResponseEnvelope struct {
	httpx.EnvelopeBase
	Data CreateContactInquiryResponse `json:"data"`
}

type ListContactInquiriesResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ListContactInquiriesResponse `json:"data"`
}

type ListContactInquiriesResponse struct {
	Inquiries []ContactInquiryResponse `json:"inquiries"`
}

type GetContactInquiryResponseEnvelope struct {
	httpx.EnvelopeBase
	Data GetContactInquiryResponse `json:"data"`
}

type GetContactInquiryResponse struct {
	Inquiry ContactInquiryResponse `json:"inquiry"`
}

type UpdateContactInquiryStatusRequest struct {
	Status string `json:"status" validate:"required"`
}

type UpdateContactInquiryStatusResponseEnvelope struct {
	httpx.EnvelopeBase
	Data UpdateContactInquiryStatusResponse `json:"data"`
}

type UpdateContactInquiryStatusResponse struct {
	Inquiry ContactInquiryResponse `json:"inquiry"`
}

type ConvertContactInquiryRequest struct {
	Source         *string `json:"source"`
	Medium         *string `json:"medium"`
	Campaign       *string `json:"campaign"`
	OwnerUserID    *uint64 `json:"owner_user_id"`
	AllowDuplicate bool    `json:"allow_duplicate"`
}

type ConvertContactInquiryResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ConvertContactInquiryResponse `json:"data"`
}

type ConvertContactInquiryResponse struct {
	Inquiry ContactInquiryResponse `json:"inquiry"`
	LeadID  uint64                 `json:"lead_id"`
}

func newContactInquiryResponse(entity *inquiry.ContactInquiry) ContactInquiryResponse {
	return ContactInquiryResponse{
		ID:             entity.ID,
		OrganizationID: entity.OrganizationID,
		ProspectID:     entity.ProspectID,
		Name:           entity.Name,
		Email:          entity.Email,
		Company:        entity.Company,
		Message:        entity.Message,
		Status:         entity.Status,
		Source:         entity.Source,
		Medium:         entity.Medium,
		Campaign:       entity.Campaign,
		CreatedAt:      entity.CreatedAt.UTC().Format("2006-01-02T15:04:05Z07:00"),
	}
}

func writeInquiryError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "contact inquiry request failed", "Failed to process contact inquiry.",
		httpx.NotFound(inquiry.ErrInquiryNotFound, "Inquiry not found."),
		httpx.Unprocessable(inquiry.ErrInvalidStatus, "Inquiry status is invalid."),
		httpx.Conflict(inquiry.ErrAlreadyConverted, "Inquiry has already been converted to a lead."),
		httpx.Conflict(inquiry.ErrConversionInProgress, "Inquiry conversion is already in progress."),
		httpx.Unprocessable(inquiry.ErrLeadCreatorUnavailable, "Lead conversion is unavailable."),
		httpx.Conflict(crm.ErrDuplicateLead, "A lead with the same email, phone, or name already exists."),
		httpx.Unprocessable(crm.ErrContactNotFound, "CRM contact does not exist."),
		httpx.Unprocessable(crm.ErrSalespersonNotFound, "Salesperson does not exist."),
		httpx.Unprocessable(crm.ErrSalesGroupNotFound, "Sales team does not exist."),
	)
}

// @Summary Submit a contact inquiry
// @Description Accepts a public contact-form submission from the marketing site and stores it for follow-up. No authentication is required and the message is rate limited per client IP. An optional organization_id routes the inquiry to a tenant inbox.
// @Tags Public
// @Accept json
// @Produce json
// @Param body body CreateContactInquiryRequest true "Contact inquiry"
// @Success 201 {object} CreateContactInquiryResponseEnvelope "Contact inquiry received."
// @Failure 400 {object} httpx.ErrorResponse "Bad request"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 429 {object} httpx.ErrorResponse "Rate limit exceeded"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Router /contact-inquiries [post]
func (h ContactInquiryHandler) Create(c fiber.Ctx) error {
	var request CreateContactInquiryRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}

	created, err := h.svc.Create(c, inquiry.CreateContactInquiryRequest{
		OrganizationID: request.OrganizationID,
		Name:           request.Name,
		Email:          request.Email,
		Company:        request.Company,
		Message:        request.Message,
		Source:         request.Source,
		Medium:         request.Medium,
		Campaign:       request.Campaign,
	})
	if err != nil {
		return writeInquiryError(c, err)
	}

	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateCreatedResponse(
		c,
		"Contact inquiry received.",
		CreateContactInquiryResponse{Inquiry: newContactInquiryResponse(created)},
	)
}

// @Summary List contact inquiries
// @Description Lists inbound contact inquiries for the caller's organization. Unassigned public submissions become visible only after an authorized conversion claims them.
// @Tags CRM Inquiries
// @Accept json
// @Produce json
// @Param page query integer false "Page number" default(1)
// @Param size query integer false "Items per page (max 100)" default(20)
// @Param sort query string false "Sort fields (comma separated, e.g. created_at:desc)"
// @Param filter query string false "Filters (repeatable, e.g. status:eq:new)"
// @Success 200 {object} ListContactInquiriesResponseEnvelope "Inquiries retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 422 {object} httpx.ErrorResponse "Invalid query parameters"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/crm/inquiries [get]
func (h ContactInquiryHandler) List(c fiber.Ctx) error {
	parsedQuery, err := httpx.ParseQueryParams(c, inquiryQueryAllowlist)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid query parameters.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	page, err := h.svc.ListInOrg(c, parsedQuery, organizationID)
	if err != nil {
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve inquiries.", err)
	}

	items := make([]ContactInquiryResponse, len(page.Items))
	for i, entity := range page.Items {
		items[i] = newContactInquiryResponse(entity)
	}

	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponseWithMeta(c, "Inquiries retrieved successfully.", ListContactInquiriesResponse{
		Inquiries: items,
	}, httpx.BuildListMeta(parsedQuery, page.Count))
}

// @Summary Get contact inquiry
// @Description Gets a single contact inquiry for the caller's organization.
// @Tags CRM Inquiries
// @Accept json
// @Produce json
// @Param id path integer true "Inquiry ID"
// @Success 200 {object} GetContactInquiryResponseEnvelope "Inquiry retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Inquiry not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/crm/inquiries/{id} [get]
func (h ContactInquiryHandler) Get(c fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid inquiry id provided.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	entity, err := h.svc.FindInOrg(c, id, organizationID)
	if err != nil {
		return writeInquiryError(c, err)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "Inquiry retrieved successfully.", GetContactInquiryResponse{
		Inquiry: newContactInquiryResponse(entity),
	})
}

// @Summary Update contact inquiry status
// @Description Moves an inquiry between new, reviewed, and archived.
// @Tags CRM Inquiries
// @Accept json
// @Produce json
// @Param id path integer true "Inquiry ID"
// @Param body body UpdateContactInquiryStatusRequest true "Inquiry status"
// @Success 200 {object} UpdateContactInquiryStatusResponseEnvelope "Inquiry updated successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Inquiry not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/crm/inquiries/{id}/status [post]
func (h ContactInquiryHandler) UpdateStatus(c fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid inquiry id provided.", nil)
	}
	var request UpdateContactInquiryStatusRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	updated, err := h.svc.UpdateStatus(c, id, organizationID, inquiry.UpdateStatusInput{Status: request.Status})
	if err != nil {
		return writeInquiryError(c, err)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "Inquiry updated successfully.", UpdateContactInquiryStatusResponse{
		Inquiry: newContactInquiryResponse(updated),
	})
}

// @Summary Convert contact inquiry to lead
// @Description Creates a CRM lead from the inquiry, preserving contact details, message, and channel, then links the inquiry to the new lead and marks it reviewed.
// @Tags CRM Inquiries
// @Accept json
// @Produce json
// @Param id path integer true "Inquiry ID"
// @Param body body ConvertContactInquiryRequest true "Conversion details"
// @Success 201 {object} ConvertContactInquiryResponseEnvelope "Inquiry converted successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Inquiry not found"
// @Failure 409 {object} httpx.ErrorResponse "Inquiry already converted or duplicate lead"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/crm/inquiries/{id}/convert [post]
func (h ContactInquiryHandler) Convert(c fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid inquiry id provided.", nil)
	}
	var request ConvertContactInquiryRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	updated, lead, err := h.svc.Convert(c, id, organizationID, inquiry.ConvertInput{
		OrganizationID: organizationID,
		Source:         request.Source,
		Medium:         request.Medium,
		Campaign:       request.Campaign,
		OwnerUserID:    request.OwnerUserID,
		AllowDuplicate: request.AllowDuplicate,
	})
	if err != nil {
		return writeInquiryError(c, err)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateCreatedResponse(c, "Inquiry converted successfully.", ConvertContactInquiryResponse{
		Inquiry: newContactInquiryResponse(updated),
		LeadID:  lead.ID,
	})
}
