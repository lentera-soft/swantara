package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type CreateCarrierRequest struct {
	OrganizationID *uint64 `json:"organization_id"`
	Name           string  `json:"name" validate:"required"`
	TrackingURLTpl *string `json:"tracking_url_tpl"`
	DeliveryItemID *uint64 `json:"delivery_item_id"`
}

type CreateCarrierResponseEnvelope struct {
	httpx.EnvelopeBase
	Data CreateCarrierResponse `json:"data"`
}
type CreateCarrierResponse struct {
	Carrier CarrierResponse `json:"carrier"`
}

// @Summary Create carrier
// @Description Creates a new carrier within the caller's organization.
// @Tags Carriers
// @Accept json
// @Produce json
// @Param body body CreateCarrierRequest true "Carrier payload"
// @Success 201 {object} CreateCarrierResponseEnvelope "Carrier created successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/carriers [post]
func (h CarrierHandler) Create(c fiber.Ctx) error {
	var request CreateCarrierRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}

	organizationID := httpx.TenantOrganizationID(c, request.OrganizationID)
	if organizationID == nil {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	carrier, err := h.svc.Create(c, &reference.Carrier{
		OrganizationID: organizationID,
		Name:           request.Name,
		TrackingURLTpl: request.TrackingURLTpl,
		DeliveryItemID: request.DeliveryItemID,
	})
	if err != nil {
		return writeCarrierError(c, err)
	}

	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateCreatedResponse(c, "Carrier created successfully.", CreateCarrierResponse{
		Carrier: newCarrierResponse(carrier),
	})
}
