package handler

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/procurement"
)

type CreatePurchaseOrderFromQuoteRequestRequest struct {
	SupplierID    *uint64    `json:"supplier_id"`
	CurrencyCode  *string    `json:"currency_code"`
	WarehouseID   *uint64    `json:"warehouse_id"`
	SupplierRef   *string    `json:"supplier_ref"`
	OrderDate     *time.Time `json:"order_date"`
	ExpectedDate  *time.Time `json:"expected_date"`
	PaymentTermID *uint64    `json:"payment_term_id"`
	Incoterm      *string    `json:"incoterm"`
}

// @Summary Create purchase order from QuoteRequest
// @Description Converts a done supplier quote request into a purchase order using the accepted quotation's supplier and line pricing. The order lines are built from the accepted quotation's lines, any fields not supplied on the request are inherited from the supplier quote request, and the resulting draft purchase order is returned.
// @Tags Supplier Quote Requests
// @Accept json
// @Produce json
// @Param id path integer true "Supplier Quote Request ID"
// @Param body body CreatePurchaseOrderFromQuoteRequestRequest true "Purchase order details"
// @Success 201 {object} CreatePurchaseOrderResponseEnvelope "Purchase order created from supplier quote request successfully."
// @Failure 400 {object} httpx.ErrorResponse "Bad request"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Supplier Quote Request not found"
// @Failure 409 {object} httpx.ErrorResponse "Conflict"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/supplier-quote-requests/{id}/purchase-order [post]
func (h SupplierQuoteRequestHandler) CreatePurchaseOrder(c fiber.Ctx) error {
	quoteRequestID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid supplier quote request id provided.", nil)
	}
	var request CreatePurchaseOrderFromQuoteRequestRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	order, err := h.svc.CreatePurchaseOrder(c, quoteRequestID, &procurement.PurchaseOrder{
		SupplierID:    derefUint64(request.SupplierID),
		CurrencyCode:  request.CurrencyCode,
		WarehouseID:   request.WarehouseID,
		SupplierRef:   request.SupplierRef,
		OrderDate:     request.OrderDate,
		ExpectedDate:  request.ExpectedDate,
		PaymentTermID: request.PaymentTermID,
		Incoterm:      request.Incoterm,
	})
	if err != nil {
		return writePurchaseOrderError(c, err)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateCreatedResponse(c, "Purchase order created from supplier quote request successfully.", CreatePurchaseOrderResponse{
		Order: newPurchaseOrderResponse(order),
	})
}

func derefUint64(value *uint64) uint64 {
	if value == nil {
		return 0
	}
	return *value
}
