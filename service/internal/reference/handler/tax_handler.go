package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type TaxHandler struct {
	svc reference.TaxService
}

func NewTaxHandler(svc reference.TaxService) TaxHandler {
	return TaxHandler{svc: svc}
}

var taxQueryAllowlist = map[string]struct{}{
	"organization_id": {},
	"name":            {},
	"type":            {},
	"scope":           {},
	"price_include":   {},
	"active":          {},
	"created_at":      {},
	"updated_at":      {},
}

func writeTaxError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "tax write failed", "Failed to save tax.",
		httpx.NotFound(reference.ErrTaxNotFound, "Tax not found."),
		httpx.Unprocessable(reference.ErrInvalidTaxType, "Tax type is not valid."),
		httpx.Unprocessable(reference.ErrInvalidTaxScope, "Tax scope is not valid."),
		httpx.Unprocessable(reference.ErrTaxAmountMissing, "Percent and fixed taxes require a positive amount."),
		httpx.Unprocessable(reference.ErrInvalidTaxAccount, "Tax account does not exist."),
	)
}
