package handler

import (
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type CountryHandler struct {
	svc reference.CountryService
}

func NewCountryHandler(svc reference.CountryService) CountryHandler {
	return CountryHandler{svc: svc}
}

type CountryResponse struct {
	Code         string    `json:"code"`
	Name         string    `json:"name"`
	CurrencyCode string    `json:"currency_code"`
	Timezone     string    `json:"timezone"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func newCountryResponse(country *reference.Country) CountryResponse {
	return CountryResponse{
		Code:         country.Code,
		Name:         country.Name,
		CurrencyCode: country.CurrencyCode,
		Timezone:     country.Timezone,
		CreatedAt:    country.CreatedAt,
		UpdatedAt:    country.UpdatedAt,
	}
}

var countryQueryAllowlist = map[string]struct{}{
	"code":          {},
	"name":          {},
	"currency_code": {},
	"timezone":      {},
	"created_at":    {},
	"updated_at":    {},
}

type ListCountriesResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ListCountriesResponse `json:"data"`
}
type ListCountriesResponse struct {
	Countries []CountryResponse `json:"countries"`
}

// @Summary List countries
// @Description Lists the available country reference data with pagination, sorting, and filtering. Each country includes its ISO 3166-1 alpha-2 code, display name, default currency, and timezone. Results are returned as JSON, or exported as CSV when format=csv is requested.
// @Tags Countries
// @Accept json
// @Produce json
// @Param page query integer false "Page number" default(1)
// @Param size query integer false "Items per page (max 100)" default(20)
// @Param sort query string false "Sort fields (comma separated, e.g. code:asc)"
// @Param filter query string false "Filters (repeatable, e.g. code:eq:ID)"
// @Param format query string false "Response format" Enums(json, xml, csv)
// @Success 200 {object} ListCountriesResponseEnvelope "Countries retrieved successfully."
// @Failure 422 {object} httpx.ErrorResponse "Invalid query parameters"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Router /countries [get]
func (h CountryHandler) List(c fiber.Ctx) error {
	parsedQuery, err := httpx.ParseQueryParams(c, countryQueryAllowlist)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid query parameters.", nil)
	}

	page, err := h.svc.ListCountries(c, parsedQuery)
	if err != nil {
		httpx.RequestLog(c).Error("country list failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve countries.", err)
	}

	items := make([]CountryResponse, len(page.Items))
	for i, country := range page.Items {
		items[i] = newCountryResponse(country)
	}

	if httpx.RequestFormat(c) == httpx.FormatCSV {
		return httpx.ExportCSV(c, fiber.StatusOK, "countries.csv", items)
	}

	return httpx.CreateSuccessResponseWithMeta(c, "Countries retrieved successfully.", ListCountriesResponse{
		Countries: items,
	}, httpx.BuildListMeta(parsedQuery, page.Count))
}

type GetCountryResponseEnvelope struct {
	httpx.EnvelopeBase
	Data GetCountryResponse `json:"data"`
}
type GetCountryResponse struct {
	Country CountryResponse `json:"country"`
}

// @Summary Get country
// @Description Returns a single country by its ISO 3166-1 alpha-2 code (case-insensitive); a 404 is returned if the country does not exist.
// @Tags Countries
// @Accept json
// @Produce json
// @Param code path string true "ISO 3166-1 alpha-2 country code"
// @Success 200 {object} GetCountryResponseEnvelope "Country retrieved successfully."
// @Failure 404 {object} httpx.ErrorResponse "Country not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Router /countries/{code} [get]
func (h CountryHandler) Get(c fiber.Ctx) error {
	country, err := h.svc.SearchCountry(c, "code", strings.ToUpper(c.Params("code")))
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "Country not found.")
		}
		httpx.RequestLog(c).Error("country lookup failed", "code", c.Params("code"), "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to get country.", err)
	}
	if country == nil {
		return httpx.CreateNotFoundResponse(c, "Country not found.")
	}

	return httpx.CreateSuccessResponse(c, "Country retrieved successfully.", GetCountryResponse{
		Country: newCountryResponse(country),
	})
}
