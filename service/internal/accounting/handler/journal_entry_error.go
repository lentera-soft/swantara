package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/accounting"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

func writeJournalEntryError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "account entry write failed", "Failed to post journal entry.",
		httpx.NotFound(accounting.ErrEntryNotFound, "Account entry not found."),
		httpx.Conflict(accounting.ErrEntryNotDraft, "Only draft journal entries can be confirmed."),
		httpx.Conflict(accounting.ErrEntryNotPosted, "Only posted account movements can be reversed."),
		httpx.Conflict(accounting.ErrEntryReversed, "Account entry is already reversed."),
		httpx.Conflict(accounting.ErrEntryImmutable, "Account entry is already reversed."),
		httpx.Conflict(accounting.ErrPeriodLocked, "The tax period for this date is closed or locked."),
		httpx.Unprocessable(accounting.ErrOriginIncomplete, "Origin entry is invalid: origin_id requires an origin_type."),
		httpx.Internal(accounting.ErrReverserMissing, "account entry reversal engine missing", "Reversal engine is not configured."),
		httpx.Unprocessable(accounting.ErrNoLines, "Journal entry is invalid: it must be balanced with valid debit and credit lines."),
		httpx.Unprocessable(accounting.ErrInvalidLine, "Journal entry is invalid: it must be balanced with valid debit and credit lines."),
		httpx.Unprocessable(accounting.ErrUnbalanced, "Journal entry is invalid: it must be balanced with valid debit and credit lines."),
	)
}
