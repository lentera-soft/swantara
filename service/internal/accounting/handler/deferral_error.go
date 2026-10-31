package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/accounting"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

func writeDeferralError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "deferral write failed", "Failed to process deferral.",
		httpx.NotFound(accounting.ErrScheduleNotFound, "Deferral schedule not found."),
		httpx.Unprocessable(accounting.ErrScheduleType, "Invalid deferral schedule."),
		httpx.Unprocessable(accounting.ErrScheduleMethod, "Invalid deferral schedule."),
		httpx.Unprocessable(accounting.ErrScheduleAmount, "Invalid deferral schedule."),
		httpx.Unprocessable(accounting.ErrScheduleNoAccount, "Invalid deferral schedule."),
		httpx.Unprocessable(accounting.ErrScheduleInvalidDate, "Invalid deferral schedule."),
		httpx.Unprocessable(accounting.ErrScheduleNoLines, "Invalid deferral schedule."),
		httpx.Unprocessable(accounting.ErrScheduleLineAmount, "Invalid deferral schedule."),
		httpx.Unprocessable(accounting.ErrScheduleNoJournal, "Invalid deferral schedule."),
	)
}
