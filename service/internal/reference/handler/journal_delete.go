package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

// @Summary Delete journal
// @Description Deletes an accounting journal by id. The journal must belong to the caller's organization; a 404 is returned otherwise.
// @Tags Journals
// @Accept json
// @Produce json
// @Param id path integer true "Journal ID"
// @Success 204 "No Content"
// @Failure 400 {object} httpx.ErrorResponse "Bad request"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Journal not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/journals/{id} [delete]
func (h JournalHandler) Delete(c fiber.Ctx) error {
	journalID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid journal id provided.", nil)
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	if err := h.svc.Delete(c, organizationID, journalID); err != nil {
		return writeJournalError(c, err)
	}

	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateNoContentResponse(c)
}
