package handler

import (
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/returns"
)

type RMAHandler struct {
	svc returns.RMAService
}

func NewRMAHandler(svc returns.RMAService) RMAHandler {
	return RMAHandler{svc: svc}
}

type RMALineResponse struct {
	ID              uint64  `json:"id"`
	RMAID           uint64  `json:"rma_id"`
	ItemID          uint64  `json:"item_id"`
	Qty             float64 `json:"qty"`
	BatchID         *uint64 `json:"batch_id"`
	Disposition     string  `json:"disposition"`
	StockMovementID *uint64 `json:"stock_movement_id"`
	CreditNoteID    *uint64 `json:"credit_note_id"`
}

func newRMALineResponse(line *returns.RMALine) RMALineResponse {
	return RMALineResponse{
		ID:              line.ID,
		RMAID:           line.RMAID,
		ItemID:          line.ItemID,
		Qty:             line.Qty,
		BatchID:         line.BatchID,
		Disposition:     line.Disposition,
		StockMovementID: line.StockMovementID,
		CreditNoteID:    line.CreditNoteID,
	}
}

type RMAResponse struct {
	ID              uint64    `json:"id"`
	OrganizationID  *uint64   `json:"organization_id"`
	Name            *string   `json:"name"`
	Type            string    `json:"type"`
	ContactID       uint64    `json:"contact_id"`
	OriginOrderType *string   `json:"origin_order_type"`
	OriginOrderID   *uint64   `json:"origin_order_id"`
	Reason          *string   `json:"reason"`
	State           string    `json:"state"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

func newRMAResponse(rma *returns.RMA) RMAResponse {
	return RMAResponse{
		ID:              rma.ID,
		OrganizationID:  rma.OrganizationID,
		Name:            rma.Name,
		Type:            rma.Type,
		ContactID:       rma.ContactID,
		OriginOrderType: rma.OriginOrderType,
		OriginOrderID:   rma.OriginOrderID,
		Reason:          rma.Reason,
		State:           rma.State,
		CreatedAt:       rma.CreatedAt,
		UpdatedAt:       rma.UpdatedAt,
	}
}

type TransitionResponse struct {
	RMA RMAResponse `json:"rma"`
}

type TransitionResponseEnvelope struct {
	httpx.EnvelopeBase
	Data TransitionResponse `json:"data"`
}

var rmaQueryAllowlist = map[string]struct{}{
	"organization_id":   {},
	"name":              {},
	"type":              {},
	"contact_id":        {},
	"origin_order_type": {},
	"origin_order_id":   {},
	"state":             {},
	"created_at":        {},
	"updated_at":        {},
}

func writeRMAError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "rma write failed", "Failed to process rma.",
		httpx.NotFound(returns.ErrRMANotFound, "RMA not found."),
		httpx.Unprocessable(returns.ErrRMAState, "RMA cannot be processed."),
		httpx.Unprocessable(returns.ErrRMAType, "RMA cannot be processed."),
		httpx.Unprocessable(returns.ErrRMAOrder, "RMA cannot be processed."),
		httpx.Unprocessable(returns.ErrRMAContactMismatch, "RMA cannot be processed."),
		httpx.Unprocessable(returns.ErrRMALines, "RMA cannot be processed."),
		httpx.Unprocessable(returns.ErrRMALineProduct, "RMA cannot be processed."),
		httpx.Unprocessable(returns.ErrRMALineQty, "RMA cannot be processed."),
		httpx.Unprocessable(returns.ErrRMADisposition, "RMA cannot be processed."),
		httpx.Unprocessable(returns.ErrRMAOrganization, "RMA cannot be processed."),
		httpx.Unprocessable(returns.ErrRMAMoveNotFound, "RMA cannot be processed without the original document."),
		httpx.Unprocessable(returns.ErrRMACost, "RMA cannot be processed without the original document."),
		httpx.Unprocessable(returns.ErrRMAScrapLocation, "RMA cannot be processed without the original document."),
		httpx.Unprocessable(returns.ErrRMAInvoice, "RMA cannot be processed without the original document."),
	)
}
