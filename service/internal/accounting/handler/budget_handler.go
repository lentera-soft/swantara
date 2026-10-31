package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/accounting"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

type BudgetHandler struct {
	svc accounting.BudgetService
}

func NewBudgetHandler(svc accounting.BudgetService) BudgetHandler {
	return BudgetHandler{svc: svc}
}

func writeBudgetError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "budget write failed", "Failed to save budget.",
		httpx.NotFound(accounting.ErrBudgetNotFound, "Budget not found."),
		httpx.Unprocessable(accounting.ErrBudgetNoLines, "Budget must have at least one line and a valid date range."),
		httpx.Unprocessable(accounting.ErrBudgetInvalidDates, "Budget must have at least one line and a valid date range."),
	)
}
