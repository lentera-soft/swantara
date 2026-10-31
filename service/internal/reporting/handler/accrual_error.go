package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/reporting"
)

func writeAccrualError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "accrual write failed", "Failed to save accrual.",
		httpx.NotFound(reporting.ErrAccrualNotFound, "Accrual not found."),
		httpx.Conflict(reporting.ErrAccrualNotPosted, "Only posted accruals can be reversed."),
		httpx.Conflict(reporting.ErrAccrualReversed, "Accrual already reversed."),
		httpx.Unprocessable(reporting.ErrUnbalancedAccrual, "Accrual lines must be balanced with positive debit or credit amounts."),
		httpx.Unprocessable(reporting.ErrConfigMissing, "Reporting configuration is missing (journal)."),
	)
}
