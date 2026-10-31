package handler

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/procurement"
)

type SupplierQuoteRequestLineResponse struct {
	ID             uint64     `json:"id"`
	QuoteRequestID uint64     `json:"quote_request_id"`
	ItemID         *uint64    `json:"item_id"`
	Description    *string    `json:"description"`
	Qty            float64    `json:"qty"`
	UnitID         *uint64    `json:"unit_id"`
	NeededBy       *time.Time `json:"needed_by"`
}

type ListSupplierQuoteRequestLinesResponse struct {
	Lines []SupplierQuoteRequestLineResponse `json:"lines"`
}

type ListSupplierQuoteRequestLinesResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ListSupplierQuoteRequestLinesResponse `json:"data"`
}

func newSupplierQuoteRequestLineResponse(line *procurement.SupplierQuoteRequestLine) SupplierQuoteRequestLineResponse {
	return SupplierQuoteRequestLineResponse{
		ID:             line.ID,
		QuoteRequestID: line.QuoteRequestID,
		ItemID:         line.ItemID,
		Description:    line.Description,
		Qty:            line.Qty,
		UnitID:         line.UnitID,
		NeededBy:       line.NeededBy,
	}
}

// @Summary List Supplier Quote Request Lines
// @Description Lists the request lines of a supplier quote request, including the requested products, quantities, units of measure, and needed-by dates. The lines are returned for the supplier quote request identified by the path id.
// @Tags Supplier Quote Requests
// @Accept json
// @Produce json
// @Param id path integer true "Supplier Quote Request ID"
// @Success 200 {object} ListSupplierQuoteRequestLinesResponseEnvelope "Supplier Quote Request lines retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Supplier Quote Request not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/supplier-quote-requests/{id}/lines [get]
func (h SupplierQuoteRequestHandler) ListLines(c fiber.Ctx) error {
	quoteRequestID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid supplier quote request id provided.", nil)
	}
	lines, err := h.svc.ListLines(c, quoteRequestID)
	if err != nil {
		return writePurchaseOrderError(c, err)
	}
	items := make([]SupplierQuoteRequestLineResponse, len(lines))
	for i, line := range lines {
		items[i] = newSupplierQuoteRequestLineResponse(line)
	}
	return httpx.CreateSuccessResponse(c, "Supplier Quote Request lines retrieved successfully.", ListSupplierQuoteRequestLinesResponse{
		Lines: items,
	})
}
