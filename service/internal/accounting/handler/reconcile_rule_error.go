package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/accounting"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

func writeReconcileRuleError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "reconcile rule apply failed", "Failed to apply reconcile rules.",
		httpx.NotFound(accounting.ErrLineNotFound, "Reconciliation record not found."),
		httpx.NotFound(accounting.ErrReconcileRuleNotFound, "Reconciliation record not found."),
		httpx.NotFound(accounting.ErrLineNotInOrganization, "Account entry line not found."),
		httpx.Unprocessable(accounting.ErrReconcileAmount, "Reconciliation amount is invalid."),
		httpx.Unprocessable(accounting.ErrReconcileExceedsBalance, "Reconciliation amount is invalid."),
		httpx.Unprocessable(accounting.ErrInvalidLine, "Reconciliation amount is invalid."),
		httpx.Unprocessable(accounting.ErrLinesDifferentAccount, "Reconciliation amount is invalid."),
		httpx.Unprocessable(accounting.ErrReconcileRuleNoAccount, "Reconciliation amount is invalid."),
	)
}
