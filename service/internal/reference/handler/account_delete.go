package handler

import (
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

// @Summary Delete account
// @Description Deletes a chart of accounts entry by id. The entry must belong to the caller's organization; a 404 is returned otherwise.
// @Tags Accounts
// @Accept json
// @Produce json
// @Param id path integer true "Account ID"
// @Success 204 "No Content"
// @Failure 400 {object} httpx.ErrorResponse "Bad request"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Account not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/accounts/{id} [delete]
func (h AccountHandler) Delete(c fiber.Ctx) error {
	accountID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid account id provided.", nil)
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	if err := h.svc.Delete(c, organizationID, accountID); err != nil {
		if errors.Is(err, reference.ErrAccountNotFound) {
			return httpx.CreateNotFoundResponse(c, "Account not found.")
		}
		httpx.RequestLog(c).Error("account deletion failed", "account_id", accountID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to delete account.", err)
	}

	return httpx.CreateNoContentResponse(c)
}
