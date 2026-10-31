package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type POSConfigHandler struct {
	configs dao.CRUD[reference.POSConfig]
}

func NewPOSConfigHandler(configs dao.CRUD[reference.POSConfig]) POSConfigHandler {
	return POSConfigHandler{configs: configs}
}

type POSConfigResponse struct {
	ID                uint64  `json:"id"`
	OrganizationID    *uint64 `json:"organization_id"`
	Name              string  `json:"name"`
	WarehouseID       *uint64 `json:"warehouse_id"`
	JournalID         *uint64 `json:"journal_id"`
	PriceBookID       *uint64 `json:"price_book_id"`
	DiscountAccountID *uint64 `json:"discount_account_id"`
}

func newPOSConfigResponse(config *reference.POSConfig) POSConfigResponse {
	return POSConfigResponse{
		ID:                config.ID,
		OrganizationID:    config.OrganizationID,
		Name:              config.Name,
		WarehouseID:       config.WarehouseID,
		JournalID:         config.JournalID,
		PriceBookID:       config.PriceBookID,
		DiscountAccountID: config.DiscountAccountID,
	}
}

var posConfigQueryAllowlist = map[string]struct{}{
	"organization_id":     {},
	"name":                {},
	"warehouse_id":        {},
	"journal_id":          {},
	"price_book_id":       {},
	"discount_account_id": {},
	"created_at":          {},
	"updated_at":          {},
}

type ListPOSConfigsResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ListPOSConfigsResponse `json:"data"`
}
type ListPOSConfigsResponse struct {
	Configs []POSConfigResponse `json:"configs"`
}

// @Summary List POS configs
// @Description Lists POS configurations with pagination, sorting, and filtering, scoped to the caller's organization.
// @Tags POS Configs
// @Accept json
// @Produce json
// @Param page query integer false "Page number" default(1)
// @Param size query integer false "Items per page (max 100)" default(20)
// @Param sort query string false "Sort fields (comma separated)"
// @Param filter query string false "Filters (repeatable)"
// @Success 200 {object} ListPOSConfigsResponseEnvelope "Configs retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 422 {object} httpx.ErrorResponse "Invalid query parameters"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/pos/configs [get]
func (h POSConfigHandler) List(c fiber.Ctx) error {
	parsedQuery, err := httpx.ParseQueryParams(c, posConfigQueryAllowlist)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid query parameters.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	page, err := h.configs.ListInOrg(c, parsedQuery, organizationID)
	if err != nil {
		httpx.RequestLog(c).Error("pos config list failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve POS configs.", err)
	}

	items := make([]POSConfigResponse, len(page.Items))
	for i, config := range page.Items {
		items[i] = newPOSConfigResponse(config)
	}
	return httpx.CreateSuccessResponseWithMeta(c, "POS configs retrieved successfully.", ListPOSConfigsResponse{
		Configs: items,
	}, httpx.BuildListMeta(parsedQuery, page.Count))
}

type CreatePOSConfigRequest struct {
	OrganizationID    *uint64 `json:"organization_id"`
	Name              string  `json:"name" validate:"required"`
	WarehouseID       *uint64 `json:"warehouse_id" validate:"required"`
	JournalID         *uint64 `json:"journal_id" validate:"required"`
	PriceBookID       *uint64 `json:"price_book_id" validate:"required"`
	DiscountAccountID *uint64 `json:"discount_account_id"`
}

type CreatePOSConfigResponseEnvelope struct {
	httpx.EnvelopeBase
	Data CreatePOSConfigResponse `json:"data"`
}
type CreatePOSConfigResponse struct {
	Config POSConfigResponse `json:"config"`
}

// @Summary Create POS config
// @Description Creates a POS configuration linking a warehouse, sales journal, and price_book for register sales.
// @Tags POS Configs
// @Accept json
// @Produce json
// @Param body body CreatePOSConfigRequest true "POS config details"
// @Success 201 {object} CreatePOSConfigResponseEnvelope "POS config created successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/pos/configs [post]
func (h POSConfigHandler) Create(c fiber.Ctx) error {
	var request CreatePOSConfigRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}

	config := &reference.POSConfig{
		OrganizationID:    httpx.TenantOrganizationID(c, request.OrganizationID),
		Name:              request.Name,
		WarehouseID:       request.WarehouseID,
		JournalID:         request.JournalID,
		PriceBookID:       request.PriceBookID,
		DiscountAccountID: request.DiscountAccountID,
	}
	created, err := h.configs.Create(c, config)
	if err != nil {
		httpx.RequestLog(c).Error("pos config create failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to create POS config.", err)
	}
	return httpx.CreateCreatedResponse(c, "POS config created successfully.", CreatePOSConfigResponse{
		Config: newPOSConfigResponse(created),
	})
}

type GetPOSConfigResponseEnvelope struct {
	httpx.EnvelopeBase
	Data GetPOSConfigResponse `json:"data"`
}
type GetPOSConfigResponse struct {
	Config POSConfigResponse `json:"config"`
}

// @Summary Get POS config
// @Description Returns a single POS configuration by id. The config must belong to the caller's organization, otherwise a 404 is returned.
// @Tags POS Configs
// @Accept json
// @Produce json
// @Param id path integer true "POS config ID"
// @Success 200 {object} GetPOSConfigResponseEnvelope "POS config retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "POS config not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/pos/configs/{id} [get]
func (h POSConfigHandler) Get(c fiber.Ctx) error {
	configID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid POS config id provided.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	config, err := h.configs.FindInOrg(c, configID, organizationID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "POS config not found.")
		}
		httpx.RequestLog(c).Error("pos config get failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve POS config.", err)
	}
	if config == nil {
		return httpx.CreateNotFoundResponse(c, "POS config not found.")
	}
	return httpx.CreateSuccessResponse(c, "POS config retrieved successfully.", GetPOSConfigResponse{
		Config: newPOSConfigResponse(config),
	})
}

type UpdatePOSConfigRequest struct {
	Name              string  `json:"name" validate:"required"`
	WarehouseID       *uint64 `json:"warehouse_id" validate:"required"`
	JournalID         *uint64 `json:"journal_id" validate:"required"`
	PriceBookID       *uint64 `json:"price_book_id" validate:"required"`
	DiscountAccountID *uint64 `json:"discount_account_id"`
}

type UpdatePOSConfigResponseEnvelope struct {
	httpx.EnvelopeBase
	Data UpdatePOSConfigResponse `json:"data"`
}
type UpdatePOSConfigResponse struct {
	Config POSConfigResponse `json:"config"`
}

// @Summary Update POS config
// @Description Updates a POS configuration's name and linked warehouse, journal, price_book, and discount account. The config must belong to the caller's organization, otherwise a 404 is returned.
// @Tags POS Configs
// @Accept json
// @Produce json
// @Param id path integer true "POS config ID"
// @Param body body UpdatePOSConfigRequest true "POS config details"
// @Success 200 {object} UpdatePOSConfigResponseEnvelope "POS config updated successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "POS config not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/pos/configs/{id} [put]
func (h POSConfigHandler) Update(c fiber.Ctx) error {
	configID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid POS config id provided.", nil)
	}

	var request UpdatePOSConfigRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	existing, err := h.configs.FindInOrg(c, configID, organizationID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "POS config not found.")
		}
		httpx.RequestLog(c).Error("pos config lookup failed", "config_id", configID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to update POS config.", err)
	}
	if existing == nil {
		return httpx.CreateNotFoundResponse(c, "POS config not found.")
	}

	updated, err := h.configs.Update(c, &reference.POSConfig{
		Base:              existing.Base,
		OrganizationID:    existing.OrganizationID,
		Name:              request.Name,
		WarehouseID:       request.WarehouseID,
		JournalID:         request.JournalID,
		PriceBookID:       request.PriceBookID,
		DiscountAccountID: request.DiscountAccountID,
	})
	if err != nil {
		httpx.RequestLog(c).Error("pos config update failed", "config_id", configID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to update POS config.", err)
	}
	return httpx.CreateSuccessResponse(c, "POS config updated successfully.", UpdatePOSConfigResponse{
		Config: newPOSConfigResponse(updated),
	})
}
