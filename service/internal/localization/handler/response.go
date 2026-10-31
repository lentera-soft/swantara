package handler

import (
	"time"

	"github.com/jalusw/swantara/apps/service/internal/localization"
)

type ProfileResponse struct {
	ID                uint64    `json:"id"`
	Name              string    `json:"name"`
	CountryCode       string    `json:"country_code"`
	CurrencyCode      string    `json:"currency_code"`
	Locale            string    `json:"locale"`
	Timezone          string    `json:"timezone"`
	DateFormat        string    `json:"date_format"`
	TaxYearStartMonth int16     `json:"tax_year_start_month"`
	Active            bool      `json:"active"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

func newProfileResponse(profile *localization.Profile) ProfileResponse {
	return ProfileResponse{
		ID:                profile.ID,
		Name:              profile.Name,
		CountryCode:       profile.CountryCode,
		CurrencyCode:      profile.CurrencyCode,
		Locale:            profile.Locale,
		Timezone:          profile.Timezone,
		DateFormat:        profile.DateFormat,
		TaxYearStartMonth: profile.TaxYearStartMonth,
		Active:            profile.Active,
		CreatedAt:         profile.CreatedAt,
		UpdatedAt:         profile.UpdatedAt,
	}
}

type TaxTemplateLineResponse struct {
	ID             uint64    `json:"id"`
	ProfileID      uint64    `json:"profile_id"`
	Name           string    `json:"name"`
	Kind           string    `json:"kind"`
	Rate           float64   `json:"rate"`
	PriceInclude   bool      `json:"price_include"`
	TaxAccountCode string    `json:"tax_account_code"`
	Sequence       int       `json:"sequence"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func newTaxTemplateLineResponse(line *localization.TaxTemplateLine) TaxTemplateLineResponse {
	return TaxTemplateLineResponse{
		ID:             line.ID,
		ProfileID:      line.ProfileID,
		Name:           line.Name,
		Kind:           line.Kind,
		Rate:           line.Rate,
		PriceInclude:   line.PriceInclude,
		TaxAccountCode: line.TaxAccountCode,
		Sequence:       line.Sequence,
		CreatedAt:      line.CreatedAt,
		UpdatedAt:      line.UpdatedAt,
	}
}

type CreateProfileRequest struct {
	Name              string `json:"name" validate:"required" example:"Indonesia"`
	CountryCode       string `json:"country_code" validate:"required" example:"ID"`
	CurrencyCode      string `json:"currency_code" validate:"required" example:"IDR"`
	Locale            string `json:"locale" example:"id-ID"`
	Timezone          string `json:"timezone" example:"Asia/Jakarta"`
	DateFormat        string `json:"date_format" example:"DD/MM/YYYY"`
	TaxYearStartMonth int16  `json:"tax_year_start_month" example:"1"`
	Active            *bool  `json:"active"`
}

type UpdateProfileRequest struct {
	Name              string `json:"name" validate:"required" example:"Indonesia"`
	CountryCode       string `json:"country_code" validate:"required" example:"ID"`
	CurrencyCode      string `json:"currency_code" validate:"required" example:"IDR"`
	Locale            string `json:"locale" example:"id-ID"`
	Timezone          string `json:"timezone" example:"Asia/Jakarta"`
	DateFormat        string `json:"date_format" example:"DD/MM/YYYY"`
	TaxYearStartMonth int16  `json:"tax_year_start_month" example:"1"`
	Active            *bool  `json:"active"`
}

type TaxTemplateLineRequest struct {
	Name           string  `json:"name" validate:"required" example:"PPN 11%"`
	Kind           string  `json:"kind" validate:"required" example:"sale"`
	Rate           float64 `json:"rate" example:"11"`
	PriceInclude   bool    `json:"price_include"`
	TaxAccountCode string  `json:"tax_account_code"`
	Sequence       int     `json:"sequence"`
}

type ReplaceTaxTemplatesRequest struct {
	Lines []TaxTemplateLineRequest `json:"lines"`
}

var profileQueryAllowlist = map[string]struct{}{
	"name":                 {},
	"country_code":         {},
	"currency_code":        {},
	"locale":               {},
	"tax_year_start_month": {},
	"active":               {},
	"created_at":           {},
	"updated_at":           {},
}
