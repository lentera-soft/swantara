package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"

	"errors"

	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type GetJournalResponseEnvelope struct {
	httpx.EnvelopeBase
	Data GetJournalResponse `json:"data"`
}
type GetJournalResponse struct {
	Journal JournalResponse `json:"journal"`
}

// @Summary Get journal
// @Description Returns a single accounting journal by id, including its code, type, and account references. The journal must belong to the caller's organization, otherwise a 404 is returned.
// @Tags Journals
// @Accept json
// @Produce json
// @Param id path integer true "Journal ID"
// @Success 200 {object} GetJournalResponseEnvelope "Journal retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Journal not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/journals/{id} [get]
func (h JournalHandler) Get(c fiber.Ctx) error {
	journalID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid journal id provided.", nil)
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	journal, err := h.svc.FindInOrg(c, journalID, organizationID)
	if err != nil {
		if dao.IsNotFound(err) || errors.Is(err, reference.ErrJournalNotFound) {
			return httpx.CreateNotFoundResponse(c, "Journal not found.")
		}
		httpx.RequestLog(c).Error("journal lookup failed", "journal_id", journalID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to get journal.", err)
	}
	if journal == nil {
		return httpx.CreateNotFoundResponse(c, "Journal not found.")
	}

	return httpx.CreateSuccessResponse(c, "Journal retrieved successfully.", GetJournalResponse{
		Journal: newJournalResponse(journal),
	})
}
