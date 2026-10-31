package handler

import (
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

// @Summary Delete tax year
// @Description Deletes a tax year by id. The year must belong to the caller's organization; a 404 is returned otherwise.
// @Tags Fiscal Years
// @Accept json
// @Produce json
// @Param id path integer true "Tax year ID"
// @Success 204 "No Content"
// @Failure 400 {object} httpx.ErrorResponse "Bad request"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Tax year not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/tax-years/{id} [delete]
func (h TaxYearHandler) Delete(c fiber.Ctx) error {
	yearID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid tax year id provided.", nil)
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	if err := h.svc.Delete(c, organizationID, yearID); err != nil {
		if errors.Is(err, reference.ErrTaxYearNotFound) {
			return httpx.CreateNotFoundResponse(c, "Tax year not found.")
		}
		httpx.RequestLog(c).Error("tax year deletion failed", "tax_year_id", yearID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to delete tax year.", err)
	}

	return httpx.CreateNoContentResponse(c)
}
