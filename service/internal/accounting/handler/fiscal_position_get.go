package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

// @Summary Get fiscal position
// @Description Gets a single fiscal position by its id together with its tax and account remap mappings, returning 404 when the position does not exist or belongs to another tenant. The maps translate source taxes and accounts into their destination counterparts.
// @Tags Fiscal Positions
// @Accept json
// @Produce json
// @Param id path integer true "Fiscal position ID"
// @Success 200 {object} GetTaxRuleResponseEnvelope "Fiscal position retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Fiscal position not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/tax-rules/{id} [get]
func (h TaxRuleHandler) Get(c fiber.Ctx) error {
	positionID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid fiscal position id provided.", nil)
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	position, err := h.resolver.FindInOrg(c, positionID, organizationID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "Fiscal position not found.")
		}
		httpx.RequestLog(c).Error("fiscal position lookup failed", "position_id", positionID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to get fiscal position.", err)
	}
	if position == nil {
		return httpx.CreateNotFoundResponse(c, "Fiscal position not found.")
	}

	taxMaps, err := h.resolver.ListTaxMaps(c, position.ID)
	if err != nil {
		httpx.RequestLog(c).Error("fiscal position tax maps lookup failed", "position_id", position.ID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to get fiscal position tax maps.", err)
	}
	accountMaps, err := h.resolver.ListAccountMaps(c, position.ID)
	if err != nil {
		httpx.RequestLog(c).Error("fiscal position account maps lookup failed", "position_id", position.ID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to get fiscal position account maps.", err)
	}

	taxItems := make([]TaxRuleTaxMapResponse, len(taxMaps))
	for i, taxMap := range taxMaps {
		taxItems[i] = newTaxRuleTaxMapResponse(taxMap)
	}
	accountItems := make([]TaxRuleAccountMapResponse, len(accountMaps))
	for i, accountMap := range accountMaps {
		accountItems[i] = newTaxRuleAccountMapResponse(accountMap)
	}

	return httpx.CreateSuccessResponse(c, "Fiscal position retrieved successfully.", GetTaxRuleResponse{
		TaxRule:     newTaxRuleResponse(position),
		TaxMaps:     taxItems,
		AccountMaps: accountItems,
	})
}
