package handler

import (
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/inventory"
)

type HoldHandler struct {
	svc inventory.HoldService
}

func NewHoldHandler(svc inventory.HoldService) HoldHandler {
	return HoldHandler{svc: svc}
}

type StockHoldResponse struct {
	ID                uint64    `json:"id"`
	MovementID        *uint64   `json:"movement_id"`
	ProductionOrderID *uint64   `json:"production_order_id"`
	BalanceID         uint64    `json:"balance_id"`
	Qty               float64   `json:"qty"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

func newStockHoldResponse(reservation *inventory.StockHold) StockHoldResponse {
	return StockHoldResponse{
		ID:                reservation.ID,
		MovementID:        reservation.MovementID,
		ProductionOrderID: reservation.ProductionOrderID,
		BalanceID:         reservation.BalanceID,
		Qty:               reservation.Qty,
		CreatedAt:         reservation.CreatedAt,
		UpdatedAt:         reservation.UpdatedAt,
	}
}

var stockReservationQueryAllowlist = map[string]struct{}{
	"movement_id":         {},
	"production_order_id": {},
	"balance_id":          {},
	"created_at":          {},
	"updated_at":          {},
}

func writeReservationError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "reservation failed", "Failed to process reservation.",
		httpx.Unprocessable(inventory.ErrBalanceNotFound, "Stock quant does not exist."),
		httpx.Unprocessable(inventory.ErrMovementQty, "Reservation quantity must be greater than zero."),
		httpx.Conflict(inventory.ErrHoldOverflow, "Reservation exceeds available stock."),
		httpx.NotFound(inventory.ErrHoldNotFound, "Reservation not found."),
	)
}
