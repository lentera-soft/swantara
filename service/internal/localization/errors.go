package localization

import "errors"

var (
	ErrProfileNotFound        = errors.New("localization profile not found")
	ErrProfileNameRequired    = errors.New("localization profile name is required")
	ErrProfileCountryInvalid  = errors.New("localization profile country code must be a 2-letter ISO code")
	ErrProfileCurrencyInvalid = errors.New("localization profile currency code must be a 3-letter ISO code")
	ErrProfileTaxYearMonth    = errors.New("localization profile tax year start month must be between 1 and 12")
	ErrProfileCountryExists   = errors.New("localization profile already exists for country")
	ErrTaxKindInvalid         = errors.New("localization tax template line kind must be sale or purchase")
	ErrTaxTemplateLineName    = errors.New("localization tax template line name is required")
	ErrTaxTemplateRateInvalid = errors.New("localization tax template line rate cannot be negative")
	ErrOrganizationNotFound   = errors.New("organization not found")
)
