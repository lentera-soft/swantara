package handler

import (
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"

	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type GetCarrierResponseEnvelope struct {
	httpx.EnvelopeBase
	Data GetCarrierResponse `json:"data"`
}
type GetCarrierResponse struct {
	Carrier CarrierResponse `json:"carrier"`
}

// @Summary Get carrier
// @Description Gets a single carrier by id. The carrier must belong to the caller's organization, otherwise a 404 is returned.
// @Tags Carriers
// @Accept json
// @Produce json
// @Param id path int true "Carrier ID"
// @Success 200 {object} GetCarrierResponseEnvelope "Carrier retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Carrier not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/carriers/{id} [get]
func (h CarrierHandler) Get(c fiber.Ctx) error {
	carrierID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid carrier id provided.", nil)
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	carrier, err := h.svc.FindInOrg(c, carrierID, organizationID)
	if err != nil {
		if dao.IsNotFound(err) || errors.Is(err, reference.ErrCarrierNotFound) {
			return httpx.CreateNotFoundResponse(c, "Carrier not found.")
		}
		httpx.RequestLog(c).Error("carrier lookup failed", "carrier_id", carrierID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to get carrier.", err)
	}
	if carrier == nil {
		return httpx.CreateNotFoundResponse(c, "Carrier not found.")
	}

	return httpx.CreateSuccessResponse(c, "Carrier retrieved successfully.", GetCarrierResponse{
		Carrier: newCarrierResponse(carrier),
	})
}
