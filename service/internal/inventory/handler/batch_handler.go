package handler

import (
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/inventory"
)

type BatchHandler struct {
	svc inventory.BatchService
}

func NewBatchHandler(svc inventory.BatchService) BatchHandler {
	return BatchHandler{svc: svc}
}

type BatchResponse struct {
	ID             uint64     `json:"id"`
	ItemID         uint64     `json:"item_id"`
	Name           string     `json:"name"`
	Ref            *string    `json:"ref"`
	ExpiryDate     *time.Time `json:"expiry_date"`
	BestBeforeDate *time.Time `json:"best_before_date"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

func newBatchResponse(batch *inventory.Batch) BatchResponse {
	return BatchResponse{
		ID:             batch.ID,
		ItemID:         batch.ItemID,
		Name:           batch.Name,
		Ref:            batch.Ref,
		ExpiryDate:     batch.ExpiryDate,
		BestBeforeDate: batch.BestBeforeDate,
		CreatedAt:      batch.CreatedAt,
		UpdatedAt:      batch.UpdatedAt,
	}
}

var stockLotQueryAllowlist = map[string]struct{}{
	"item_id":    {},
	"name":       {},
	"created_at": {},
	"updated_at": {},
}

func writeLotError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "stock batch write failed", "Failed to save stock batch.",
		httpx.Unprocessable(inventory.ErrVariantNotFound, "Item variant does not exist."),
		httpx.Unprocessable(inventory.ErrItemNotFound, "Item template does not exist."),
		httpx.Unprocessable(inventory.ErrBatchTrackingDisabled, "Item does not use batch/serial tracking."),
		httpx.Conflict(inventory.ErrBatchNameTaken, "Lot name already exists for this item."),
	)
}
