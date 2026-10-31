package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/commission"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

type CommissionHandler struct {
	svc commission.CommissionService
}

func NewCommissionHandler(
	svc commission.CommissionService,
) CommissionHandler {
	return CommissionHandler{svc: svc}
}

func writeCommissionError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "commission write failed", "Failed to process request.",
		httpx.NotFound(commission.ErrPlanNotFound, "Resource not found."),
		httpx.NotFound(commission.ErrRuleNotFound, "Resource not found."),
		httpx.NotFound(commission.ErrAssignmentNotFound, "Resource not found."),
		httpx.NotFound(commission.ErrEntryNotFound, "Resource not found."),
		httpx.NotFound(commission.ErrInvoiceNotFound, "Resource not found."),
		httpx.Unprocessable(commission.ErrPlanInactive, "Request cannot be processed."),
		httpx.Unprocessable(commission.ErrPlanInvalidBasis, "Request cannot be processed."),
		httpx.Unprocessable(commission.ErrRuleInvalid, "Request cannot be processed."),
		httpx.Unprocessable(commission.ErrRuleRange, "Request cannot be processed."),
		httpx.Unprocessable(commission.ErrAssignmentOverlap, "Request cannot be processed."),
		httpx.Unprocessable(commission.ErrEntryNotConfirmed, "Request cannot be processed."),
		httpx.Unprocessable(commission.ErrEntryNotDraft, "Request cannot be processed."),
		httpx.Unprocessable(commission.ErrEntryNotOpen, "Request cannot be processed."),
		httpx.Unprocessable(commission.ErrNoRuleMatches, "Request cannot be processed."),
		httpx.Unprocessable(commission.ErrAccountsRequired, "Request cannot be processed."),
		httpx.Unprocessable(commission.ErrSourceMissing, "Request cannot be processed."),
		httpx.Unprocessable(commission.ErrEntryDuplicate, "Request cannot be processed."),
	)
}
