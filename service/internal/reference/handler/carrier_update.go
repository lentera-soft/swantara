package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type UpdateCarrierRequest struct {
	Name           string  `json:"name" validate:"required"`
	TrackingURLTpl *string `json:"tracking_url_tpl"`
	DeliveryItemID *uint64 `json:"delivery_item_id"`
}

type UpdateCarrierResponseEnvelope struct {
	httpx.EnvelopeBase
	Data UpdateCarrierResponse `json:"data"`
}
type UpdateCarrierResponse struct {
	Carrier CarrierResponse `json:"carrier"`
}

// @Summary Update carrier
// @Description Updates an existing carrier. The carrier must belong to the caller's organization, otherwise a 404 is returned.
// @Tags Carriers
// @Accept json
// @Produce json
// @Param id path int true "Carrier ID"
// @Param body body UpdateCarrierRequest true "Carrier payload"
// @Success 200 {object} UpdateCarrierResponseEnvelope "Carrier updated successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Carrier not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/carriers/{id} [put]
func (h CarrierHandler) Update(c fiber.Ctx) error {
	carrierID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid carrier id provided.", nil)
	}

	var request UpdateCarrierRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	carrier := &reference.Carrier{
		Base:           model.Base{ID: carrierID},
		Name:           request.Name,
		TrackingURLTpl: request.TrackingURLTpl,
		DeliveryItemID: request.DeliveryItemID,
	}

	updated, err := h.svc.Update(c, organizationID, carrier)
	if err != nil {
		return writeCarrierError(c, err)
	}

	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "Carrier updated successfully.", UpdateCarrierResponse{
		Carrier: newCarrierResponse(updated),
	})
}
