package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/payroll"
)

func writePayrollError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "payroll write failed", "Failed to process payroll.",
		httpx.NotFound(payroll.ErrRunNotFound, "Resource not found."),
		httpx.NotFound(payroll.ErrPayslipNotFound, "Resource not found."),
		httpx.NotFound(payroll.ErrRuleNotFound, "Resource not found."),
		httpx.Unprocessable(payroll.ErrRunState, "Payroll cannot be processed."),
		httpx.Unprocessable(payroll.ErrRunPeriod, "Payroll cannot be processed."),
		httpx.Unprocessable(payroll.ErrRunOrganization, "Payroll cannot be processed."),
		httpx.Unprocessable(payroll.ErrRunNoPayslips, "Payroll cannot be processed."),
		httpx.Unprocessable(payroll.ErrRuleCode, "Payroll cannot be processed."),
		httpx.Unprocessable(payroll.ErrRuleCategory, "Payroll cannot be processed."),
		httpx.Unprocessable(payroll.ErrRuleComputeType, "Payroll cannot be processed."),
		httpx.Unprocessable(payroll.ErrRuleAccounts, "Payroll cannot be processed."),
		httpx.Unprocessable(payroll.ErrRuleAccount, "Payroll cannot be processed."),
		httpx.Unprocessable(payroll.ErrNoBankAccount, "Payroll cannot be processed."),
		httpx.Unprocessable(payroll.ErrNoNetPayable, "Payroll cannot be processed."),
		httpx.Unprocessable(payroll.ErrRunSequence, "Payroll run sequence is not configured."),
	)
}
