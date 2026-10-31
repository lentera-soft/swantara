package handler

import (
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/kernel/amount"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type FxRateHandler struct {
	fxRateSvc  reference.FxRateService
	rateSource amount.RateSource
}

func NewFxRateHandler(fxRateSvc reference.FxRateService, rateSource amount.RateSource) FxRateHandler {
	return FxRateHandler{fxRateSvc: fxRateSvc, rateSource: rateSource}
}

type FxRateResponse struct {
	ID             uint64    `json:"id"`
	CurrencyCode   string    `json:"currency_code"`
	OrganizationID *uint64   `json:"organization_id"`
	Rate           float64   `json:"rate"`
	RateType       string    `json:"rate_type"`
	ValidFrom      time.Time `json:"valid_from"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func newFxRateResponse(rate *reference.FxRate) FxRateResponse {
	return FxRateResponse{
		ID:             rate.ID,
		CurrencyCode:   rate.CurrencyCode,
		OrganizationID: rate.OrganizationID,
		Rate:           rate.Rate,
		RateType:       rate.RateType,
		ValidFrom:      rate.ValidFrom,
		CreatedAt:      rate.CreatedAt,
		UpdatedAt:      rate.UpdatedAt,
	}
}

var fxRateQueryAllowlist = map[string]struct{}{
	"currency_code":   {},
	"organization_id": {},
	"rate_type":       {},
	"valid_from":      {},
	"created_at":      {},
	"updated_at":      {},
}

func writeFxRateError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "fx rate write failed", "Failed to save FX rate.",
		httpx.Unprocessable(reference.ErrCurrencyNotFound, "Currency does not exist."),
		httpx.Unprocessable(reference.ErrRateValidFromMissing, "Valid from date is required."),
		httpx.Unprocessable(amount.ErrInvalidRate, "FX rate must be greater than zero with a valid rate type."),
	)
}
