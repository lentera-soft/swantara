package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

func (h JournalEntryHandler) Confirm(c fiber.Ctx) error {
	moveID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid account entry id provided.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	entry, err := h.poster.Confirm(c, organizationID, moveID)
	if err != nil {
		return writeJournalEntryError(c, err)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "Journal entry posted successfully.", PostJournalEntryResponse{
		Entry: newJournalEntryResponse(entry),
	})
}
