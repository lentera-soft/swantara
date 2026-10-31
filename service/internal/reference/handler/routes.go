package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

func (h FxRateHandler) Register(api fiber.Router, guards httpx.RouteGuards) {
	rates := api.Group("/fx-rates", guards.AuthN)

	rates.Get("/", guards.Guard("fx-rate", "view"), h.List)
	rates.Post("/", guards.Guard("fx-rate", "create"), h.Create)
	rates.Post("/resolve", guards.Guard("fx-rate", "view"), h.Resolve)
	rates.Get("/:id", guards.Guard("fx-rate", "view"), h.Get)
	rates.Put("/:id", guards.Guard("fx-rate", "update"), h.Update)
	rates.Delete("/:id", guards.Guard("fx-rate", "delete"), h.Delete)
}

func (h CurrencyHandler) Register(api fiber.Router, _ ...httpx.RouteGuards) {
	currencies := api.Group("/currencies")

	currencies.Get("/", h.List)
	currencies.Get("/:code", h.Get)
}

func (h CountryHandler) Register(api fiber.Router, _ ...httpx.RouteGuards) {
	countries := api.Group("/countries")

	countries.Get("/", h.List)
	countries.Get("/:code", h.Get)
}

func (h UnitGroupHandler) Register(api fiber.Router, guards httpx.RouteGuards) {
	categories := api.Group("/unit-groups")

	categories.Get("/", h.List)
	categories.Get("/:id", h.Get)
	categories.Post("/", guards.AuthN, h.Create)
	categories.Put("/:id", guards.AuthN, h.Update)
	categories.Delete("/:id", guards.AuthN, h.Delete)
}

func (h UnitHandler) Register(api fiber.Router, guards httpx.RouteGuards) {
	units := api.Group("/units")

	units.Get("/", h.List)
	units.Get("/:id", h.Get)
	units.Post("/convert", h.Convert)
	units.Post("/", guards.AuthN, h.Create)
	units.Put("/:id", guards.AuthN, h.Update)
	units.Delete("/:id", guards.AuthN, h.Delete)
}

func (h DimensionHandler) Register(api fiber.Router, guards httpx.RouteGuards) {
	accounts := api.Group("/dimensions", guards.AuthN)

	accounts.Get("/", guards.Guard("dimension", "view"), h.List)
	accounts.Post("/", guards.Guard("dimension", "create"), h.Create)
	accounts.Get("/:id", guards.Guard("dimension", "view"), h.Get)
	accounts.Put("/:id", guards.Guard("dimension", "update"), h.Update)
	accounts.Delete("/:id", guards.Guard("dimension", "delete"), h.Delete)
}

func (h PaymentTermHandler) Register(api fiber.Router, guards httpx.RouteGuards) {
	terms := api.Group("/payment-terms", guards.AuthN)

	terms.Get("/", h.List)
	terms.Post("/", h.Create)
	terms.Get("/:id", h.Get)
	terms.Put("/:id", h.Update)
	terms.Delete("/:id", h.Delete)
	terms.Post("/:id/splits", h.Splits)
}

func (h PaymentTermHandler) RegisterOrg(api fiber.Router, guards httpx.RouteGuards) {
	terms := api.Group("/payment-terms", guards.AuthN)

	terms.Get("/", guards.Guard("payment-term", "view"), h.List)
	terms.Post("/", guards.Guard("payment-term", "create"), h.Create)
	terms.Get("/:id", guards.Guard("payment-term", "view"), h.Get)
	terms.Put("/:id", guards.Guard("payment-term", "update"), h.Update)
	terms.Delete("/:id", guards.Guard("payment-term", "delete"), h.Delete)
	terms.Post("/:id/splits", guards.Guard("payment-term", "view"), h.Splits)
}

func (h AccountHandler) Register(api fiber.Router, guards httpx.RouteGuards) {
	accounts := api.Group("/accounts", guards.AuthN)

	accounts.Get("/", guards.Guard("account", "view"), h.List)
	accounts.Post("/", guards.Guard("account", "create"), h.Create)
	accounts.Get("/:id", guards.Guard("account", "view"), h.Get)
	accounts.Put("/:id", guards.Guard("account", "update"), h.Update)
	accounts.Delete("/:id", guards.Guard("account", "delete"), h.Delete)
}

func (h JournalHandler) Register(api fiber.Router, guards httpx.RouteGuards) {
	journals := api.Group("/journals", guards.AuthN)

	journals.Get("/", guards.Guard("journal", "view"), h.List)
	journals.Post("/", guards.Guard("journal", "create"), h.Create)
	journals.Get("/:id", guards.Guard("journal", "view"), h.Get)
	journals.Put("/:id", guards.Guard("journal", "update"), h.Update)
	journals.Delete("/:id", guards.Guard("journal", "delete"), h.Delete)
}

func (h TaxHandler) Register(api fiber.Router, guards httpx.RouteGuards) {
	taxes := api.Group("/taxes", guards.AuthN)

	taxes.Get("/", guards.Guard("tax", "view"), h.List)
	taxes.Post("/", guards.Guard("tax", "create"), h.Create)
	taxes.Get("/:id", guards.Guard("tax", "view"), h.Get)
	taxes.Put("/:id", guards.Guard("tax", "update"), h.Update)
	taxes.Delete("/:id", guards.Guard("tax", "delete"), h.Delete)
}

func (h TaxYearHandler) Register(api fiber.Router, guards httpx.RouteGuards) {
	years := api.Group("/tax-years", guards.AuthN)

	years.Get("/", guards.Guard("tax-year", "view"), h.List)
	years.Post("/", guards.Guard("tax-year", "create"), h.Create)
	years.Get("/:id", guards.Guard("tax-year", "view"), h.Get)
	years.Put("/:id", guards.Guard("tax-year", "update"), h.Update)
	years.Delete("/:id", guards.Guard("tax-year", "delete"), h.Delete)
}

func (h CarrierHandler) RegisterOrg(api fiber.Router, guards httpx.RouteGuards) {
	carriers := api.Group("/carriers", guards.AuthN)

	carriers.Get("/", guards.Guard("carrier", "view"), h.List)
	carriers.Post("/", guards.Guard("carrier", "create"), h.Create)
	carriers.Get("/:id", guards.Guard("carrier", "view"), h.Get)
	carriers.Put("/:id", guards.Guard("carrier", "update"), h.Update)
	carriers.Delete("/:id", guards.Guard("carrier", "delete"), h.Delete)
}

func (h CampaignHandler) RegisterOrg(api fiber.Router, guards httpx.RouteGuards) {
	campaigns := api.Group("/campaigns", guards.AuthN)

	campaigns.Get("/", guards.Guard("campaign", "view"), h.List)
	campaigns.Post("/", guards.Guard("campaign", "create"), h.Create)
	campaigns.Get("/:id", guards.Guard("campaign", "view"), h.Get)
	campaigns.Put("/:id", guards.Guard("campaign", "update"), h.Update)
	campaigns.Delete("/:id", guards.Guard("campaign", "delete"), h.Delete)
}
