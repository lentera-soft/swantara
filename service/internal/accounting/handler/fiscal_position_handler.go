package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/accounting"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

type TaxRuleHandler struct {
	resolver accounting.TaxRuleResolver
}

func NewTaxRuleHandler(resolver accounting.TaxRuleResolver) TaxRuleHandler {
	return TaxRuleHandler{resolver: resolver}
}

var taxRuleQueryAllowlist = map[string]struct{}{
	"organization_id": {},
	"name":            {},
	"country_code":    {},
	"auto_apply":      {},
	"active":          {},
	"created_at":      {},
	"updated_at":      {},
}

func writeTaxRuleError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "fiscal position write failed", "Failed to save fiscal position.",
		httpx.NotFound(accounting.ErrTaxRuleNotFound, "Fiscal position not found."),
	)
}
