package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/localization"
)

func writeProfileError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "localization write failed", "Failed to save localization data.",
		httpx.NotFound(localization.ErrProfileNotFound, "Localization profile not found."),
		httpx.Unprocessable(localization.ErrProfileNameRequired, "Localization profile name is required."),
		httpx.Unprocessable(localization.ErrProfileCountryInvalid, "Localization profile country code must be a 2-letter ISO code."),
		httpx.Unprocessable(localization.ErrProfileCurrencyInvalid, "Localization profile currency code must be a 3-letter ISO code."),
		httpx.Unprocessable(localization.ErrProfileTaxYearMonth, "Localization profile tax year start month must be between 1 and 12."),
		httpx.Conflict(localization.ErrProfileCountryExists, "Localization profile already exists for this country."),
		httpx.Unprocessable(localization.ErrTaxKindInvalid, "Tax template line kind must be sale or purchase."),
		httpx.Unprocessable(localization.ErrTaxTemplateLineName, "Tax template line name is required."),
		httpx.Unprocessable(localization.ErrTaxTemplateRateInvalid, "Tax template line rate cannot be negative."),
		httpx.NotFound(localization.ErrOrganizationNotFound, "Organization not found."),
	)
}
