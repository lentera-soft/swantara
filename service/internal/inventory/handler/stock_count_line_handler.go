package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/inventory"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type ListStockCountLinesResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ListStockCountLinesResponse `json:"data"`
}
type ListStockCountLinesResponse struct {
	Lines []StockCountLineResponse `json:"lines"`
}

// @Summary List inventory count lines
// @Description Lists the lines of an inventory count, including the theoretical, counted, and difference quantities for each item, optionally exported as CSV. The count must belong to the caller's organization, otherwise a 404 Not Found is returned.
// @Tags Inventory Counts
// @Accept json
// @Produce json
// @Param id path integer true "Inventory count ID"
// @Success 200 {object} ListStockCountLinesResponseEnvelope "Inventory count lines retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Inventory count not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/stock-counts/{id}/lines [get]
func (h StockCountHandler) ListLines(c fiber.Ctx) error {
	stockCountID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid inventory count id provided.", nil)
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	count, err := h.svc.FindInOrg(c, stockCountID, organizationID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "Inventory count not found.")
		}
		httpx.RequestLog(c).Error("inventory count lookup failed", "stock_count_id", stockCountID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve inventory count lines.", err)
	}
	if count == nil {
		return httpx.CreateNotFoundResponse(c, "Inventory count not found.")
	}

	lines, err := h.svc.ListLines(c, stockCountID)
	if err != nil {
		httpx.RequestLog(c).Error("inventory count line list failed", "stock_count_id", stockCountID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve inventory count lines.", err)
	}

	items := make([]StockCountLineResponse, len(lines))
	for i, line := range lines {
		items[i] = newStockCountLineResponse(line)
	}

	if httpx.RequestFormat(c) == httpx.FormatCSV {
		return httpx.ExportCSV(c, fiber.StatusOK, "inventory-count-lines.csv", items)
	}

	return httpx.CreateSuccessResponse(c, "Inventory count lines retrieved successfully.", ListStockCountLinesResponse{
		Lines: items,
	})
}

type AddStockCountLineRequest struct {
	ItemID     uint64  `json:"item_id" validate:"required,gt=0"`
	BatchID    *uint64 `json:"batch_id"`
	CountedQty float64 `json:"counted_qty"`
}

type StockCountLineResponseEnvelope struct {
	httpx.EnvelopeBase
	Data StockCountLineResponseData `json:"data"`
}
type StockCountLineResponseData struct {
	Line StockCountLineResponse `json:"line"`
}

// @Summary Add inventory count line
// @Description Adds a counted line to a draft inventory count. The count must belong to the caller's organization and remain in draft; the item's current on-hand quantity is captured as the theoretical quantity and the difference is computed from the supplied counted quantity.
// @Tags Inventory Counts
// @Accept json
// @Produce json
// @Param id path integer true "Inventory count ID"
// @Param body body AddStockCountLineRequest true "Count line details"
// @Success 201 {object} StockCountLineResponseEnvelope "Inventory count line created successfully."
// @Failure 400 {object} httpx.ErrorResponse "Bad request"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Inventory count not found"
// @Failure 409 {object} httpx.ErrorResponse "Inventory count is not in draft"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/stock-counts/{id}/lines [post]
func (h StockCountHandler) AddLine(c fiber.Ctx) error {
	stockCountID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid inventory count id provided.", nil)
	}
	var request AddStockCountLineRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	if _, err := h.svc.FindInOrg(c, stockCountID, organizationID); err != nil {
		return writeCountError(c, err)
	}

	line, err := h.svc.AddLine(c, stockCountID, inventory.StockCountLineRequest{
		ItemID:     request.ItemID,
		BatchID:    request.BatchID,
		CountedQty: request.CountedQty,
	})
	if err != nil {
		return writeCountError(c, err)
	}
	return httpx.CreateCreatedResponse(c, "Inventory count line created successfully.", StockCountLineResponseData{
		Line: newStockCountLineResponse(line),
	})
}

type UpdateStockCountLineRequest struct {
	CountedQty float64 `json:"counted_qty"`
}

// @Summary Update inventory count line
// @Description Updates the counted quantity of a line on a draft inventory count, recomputing the difference against the line's theoretical quantity. The count must belong to the caller's organization and remain in draft.
// @Tags Inventory Counts
// @Accept json
// @Produce json
// @Param id path integer true "Inventory count ID"
// @Param line_id path integer true "Inventory count line ID"
// @Param body body UpdateStockCountLineRequest true "Count line details"
// @Success 200 {object} StockCountLineResponseEnvelope "Inventory count line updated successfully."
// @Failure 400 {object} httpx.ErrorResponse "Bad request"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Inventory count or line not found"
// @Failure 409 {object} httpx.ErrorResponse "Inventory count is not in draft"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/stock-counts/{id}/lines/{line_id} [put]
func (h StockCountHandler) UpdateLine(c fiber.Ctx) error {
	stockCountID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid inventory count id provided.", nil)
	}
	lineID, err := strconv.ParseUint(c.Params("line_id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid inventory count line id provided.", nil)
	}
	var request UpdateStockCountLineRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	if _, err := h.svc.FindInOrg(c, stockCountID, organizationID); err != nil {
		return writeCountError(c, err)
	}

	line, err := h.svc.UpdateLine(c, stockCountID, lineID, request.CountedQty)
	if err != nil {
		return writeCountError(c, err)
	}
	return httpx.CreateSuccessResponse(c, "Inventory count line updated successfully.", StockCountLineResponseData{
		Line: newStockCountLineResponse(line),
	})
}

// @Summary Delete inventory count line
// @Description Deletes a line from a draft inventory count. The count must belong to the caller's organization and remain in draft. Responds with 204 No Content on success.
// @Tags Inventory Counts
// @Accept json
// @Produce json
// @Param id path integer true "Inventory count ID"
// @Param line_id path integer true "Inventory count line ID"
// @Success 204 "No Content"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Inventory count or line not found"
// @Failure 409 {object} httpx.ErrorResponse "Inventory count is not in draft"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/stock-counts/{id}/lines/{line_id} [delete]
func (h StockCountHandler) DeleteLine(c fiber.Ctx) error {
	stockCountID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid inventory count id provided.", nil)
	}
	lineID, err := strconv.ParseUint(c.Params("line_id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid inventory count line id provided.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	if _, err := h.svc.FindInOrg(c, stockCountID, organizationID); err != nil {
		return writeCountError(c, err)
	}

	if err := h.svc.DeleteLine(c, stockCountID, lineID); err != nil {
		return writeCountError(c, err)
	}
	return httpx.CreateNoContentResponse(c)
}
