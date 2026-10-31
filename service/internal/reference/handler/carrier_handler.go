package handler

import (
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type CarrierHandler struct {
	svc reference.CarrierService
}

func NewCarrierHandler(svc reference.CarrierService) CarrierHandler {
	return CarrierHandler{svc: svc}
}

type CarrierResponse struct {
	ID             uint64    `json:"id"`
	OrganizationID *uint64   `json:"organization_id"`
	Name           string    `json:"name"`
	TrackingURLTpl *string   `json:"tracking_url_tpl"`
	DeliveryItemID *uint64   `json:"delivery_item_id"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func newCarrierResponse(carrier *reference.Carrier) CarrierResponse {
	return CarrierResponse{
		ID:             carrier.ID,
		OrganizationID: carrier.OrganizationID,
		Name:           carrier.Name,
		TrackingURLTpl: carrier.TrackingURLTpl,
		DeliveryItemID: carrier.DeliveryItemID,
		CreatedAt:      carrier.CreatedAt,
		UpdatedAt:      carrier.UpdatedAt,
	}
}

var carrierQueryAllowlist = map[string]struct{}{
	"organization_id":  {},
	"name":             {},
	"tracking_url_tpl": {},
	"delivery_item_id": {},
	"created_at":       {},
	"updated_at":       {},
}

func writeCarrierError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "carrier write failed", "Failed to save carrier.",
		httpx.NotFound(reference.ErrCarrierNotFound, "Carrier not found."),
		httpx.Unprocessable(reference.ErrCarrierName, "Carrier name is required."),
		httpx.Unprocessable(reference.ErrCarrierDeliveryProduct, "Delivery item does not exist."),
	)
}
