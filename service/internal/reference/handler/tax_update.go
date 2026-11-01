package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type UpdateTaxRequest struct {
	Name               string   `json:"name" validate:"required"`
	Amount             *float64 `json:"amount"`
	Type               string   `json:"type" validate:"required"`
	Scope              string   `json:"scope" validate:"required"`
	PriceInclude       bool     `json:"price_include"`
	TaxAccountID       *uint64  `json:"tax_account_id"`
	RefundTaxAccountID *uint64  `json:"refund_tax_account_id"`
	Active             bool     `json:"active"`
}

// @Summary Update tax
// @Description Updates a tax definition's name, type, scope, amount, accounts, and active status. Percent and fixed taxes require a positive amount, the type and scope must be valid, and any referenced accounts must exist; a 404 is returned if the tax does not belong to the caller.
// @Tags Taxes
// @Accept json
// @Produce json
// @Param id path integer true "Tax ID"
// @Param body body UpdateTaxRequest true "Tax details"
// @Success 200 {object} UpdateTaxResponseEnvelope "Tax updated successfully."
// @Failure 400 {object} httpx.ErrorResponse "Bad request"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Tax not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/taxes/{id} [put]
func (h TaxHandler) Update(c fiber.Ctx) error {
	taxID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid tax id provided.", nil)
	}

	var request UpdateTaxRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	tax := &reference.Tax{
		Base:               model.Base{ID: taxID},
		Name:               request.Name,
		Amount:             request.Amount,
		Type:               request.Type,
		Scope:              request.Scope,
		PriceInclude:       request.PriceInclude,
		TaxAccountID:       request.TaxAccountID,
		RefundTaxAccountID: request.RefundTaxAccountID,
		Active:             request.Active,
	}

	updated, err := h.svc.Update(c, organizationID, tax)
	if err != nil {
		return writeTaxError(c, err)
	}

	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "Tax updated successfully.", UpdateTaxResponse{
		Tax: newTaxResponse(updated),
	})
}
