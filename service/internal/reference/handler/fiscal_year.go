package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type TaxYearHandler struct {
	svc reference.TaxYearService
}

func NewTaxYearHandler(svc reference.TaxYearService) TaxYearHandler {
	return TaxYearHandler{svc: svc}
}

var taxYearQueryAllowlist = map[string]struct{}{
	"organization_id": {},
	"name":            {},
	"state":           {},
	"created_at":      {},
	"updated_at":      {},
}

func writeTaxYearError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "tax year write failed", "Failed to save tax year.",
		httpx.Unprocessable(reference.ErrInvalidTaxYear, "Tax year date range is invalid."),
	)
}
