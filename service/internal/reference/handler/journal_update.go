package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type UpdateJournalRequest struct {
	Code             *string `json:"code"`
	Name             string  `json:"name" validate:"required"`
	Type             string  `json:"type" validate:"required"`
	DefaultAccountID *uint64 `json:"default_account_id"`
	BankAccountID    *uint64 `json:"bank_account_id"`
}

type UpdateJournalResponseEnvelope struct {
	httpx.EnvelopeBase
	Data UpdateJournalResponse `json:"data"`
}
type UpdateJournalResponse struct {
	Journal JournalResponse `json:"journal"`
}

// @Summary Update journal
// @Description Updates an accounting journal's code, name, type, and account references. The type must be valid and the default account, if given, must belong to the same organization; a 404 is returned if the journal does not belong to the caller.
// @Tags Journals
// @Accept json
// @Produce json
// @Param id path integer true "Journal ID"
// @Param body body UpdateJournalRequest true "Journal details"
// @Success 200 {object} UpdateJournalResponseEnvelope "Journal updated successfully."
// @Failure 400 {object} httpx.ErrorResponse "Bad request"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Journal not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/journals/{id} [put]
func (h JournalHandler) Update(c fiber.Ctx) error {
	journalID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid journal id provided.", nil)
	}

	var request UpdateJournalRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	journal := &reference.Journal{
		Base:             model.Base{ID: journalID},
		Name:             request.Name,
		Code:             request.Code,
		Type:             request.Type,
		DefaultAccountID: request.DefaultAccountID,
		BankAccountID:    request.BankAccountID,
	}

	updated, err := h.svc.Update(c, organizationID, journal)
	if err != nil {
		return writeJournalError(c, err)
	}

	return httpx.CreateSuccessResponse(c, "Journal updated successfully.", UpdateJournalResponse{
		Journal: newJournalResponse(updated),
	})
}
