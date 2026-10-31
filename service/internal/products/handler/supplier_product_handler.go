package handler

import (
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/products"
)

type SupplierProductHandler struct {
	svc products.SupplierProductService
}

func NewSupplierProductHandler(svc products.SupplierProductService) SupplierProductHandler {
	return SupplierProductHandler{svc: svc}
}

type SupplierProductResponse struct {
	ID                  uint64     `json:"id"`
	ItemID              uint64     `json:"item_id"`
	SupplierID          uint64     `json:"supplier_id"`
	SupplierSku         *string    `json:"supplier_sku"`
	SupplierProductName *string    `json:"supplier_product_name"`
	MinQty              float64    `json:"min_qty"`
	Price               *float64   `json:"price"`
	CurrencyCode        *string    `json:"currency_code"`
	LeadTimeDays        *int       `json:"lead_time_days"`
	Priority            int        `json:"priority"`
	ValidFrom           *time.Time `json:"valid_from"`
	ValidTo             *time.Time `json:"valid_to"`
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`
}

func newSupplierProductResponse(offer *products.SupplierProduct) SupplierProductResponse {
	return SupplierProductResponse{
		ID:                  offer.ID,
		ItemID:              offer.ItemID,
		SupplierID:          offer.SupplierID,
		SupplierSku:         offer.SupplierSku,
		SupplierProductName: offer.SupplierProductName,
		MinQty:              offer.MinQty,
		Price:               offer.Price,
		CurrencyCode:        offer.CurrencyCode,
		LeadTimeDays:        offer.LeadTimeDays,
		Priority:            offer.Priority,
		ValidFrom:           offer.ValidFrom,
		ValidTo:             offer.ValidTo,
		CreatedAt:           offer.CreatedAt,
		UpdatedAt:           offer.UpdatedAt,
	}
}

var supplierProductQueryAllowlist = map[string]struct{}{
	"item_id":       {},
	"supplier_id":   {},
	"currency_code": {},
	"priority":      {},
	"created_at":    {},
	"updated_at":    {},
}

func writeSupplierProductError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "supplier item write failed", "Failed to save supplier item.",
		httpx.NotFound(products.ErrVariantNotFound, "Item variant not found."),
		httpx.NotFound(products.ErrSupplierNotFound, "Supplier contact not found."),
		httpx.Unprocessable(products.ErrSupplierNotSupplier, "Supplier contact is not an active supplier."),
		httpx.Unprocessable(products.ErrInvalidValidity, "Supplier item validity window is invalid."),
		httpx.Unprocessable(products.ErrInvalidMinQty, "Supplier item minimum quantity cannot be negative."),
		httpx.Unprocessable(products.ErrNoValidOffer, "No valid supplier offer matches the variant, quantity and date."),
	)
}
