package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/accounting"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

func writeTaxPeriodError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "tax period write failed", "Failed to save tax period.",
		httpx.NotFound(accounting.ErrPeriodNotFound, "Tax period not found."),
		httpx.Unprocessable(accounting.ErrInvalidPeriod, "Tax period date range is invalid."),
		httpx.Unprocessable(accounting.ErrInvalidPeriodState, "Tax period state is not valid."),
		httpx.Conflict(accounting.ErrPeriodNotClosed, "Tax period must be closed before it can be locked."),
		httpx.Conflict(accounting.ErrPeriodLocked, "Tax period is closed or locked."),
		httpx.Conflict(accounting.ErrPeriodNotOpen, "Tax period is closed or locked."),
		httpx.Conflict(accounting.ErrPeriodAlreadyClosed, "Tax period is closed or locked."),
		httpx.Conflict(accounting.ErrCloseRequiresEntries, "Period close requires closing entries."),
		httpx.Unprocessable(accounting.ErrTaxYearNotFound, "Tax year does not exist for the organization."),
	)
}
