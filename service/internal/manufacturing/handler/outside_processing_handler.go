package handler

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/manufacturing"
)

type OutsideProcessingHandler struct {
	svc manufacturing.OutsideProcessingService
}

func (h OutsideProcessingHandler) ensureOrderInOrg(c fiber.Ctx, orderID uint64) error {
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	order, err := h.svc.FindInOrg(c, orderID, organizationID)
	if err != nil {
		return writeSubcontractError(c, err)
	}
	if order == nil {
		return httpx.CreateNotFoundResponse(c, "Outside processing order not found.")
	}
	return nil
}

func NewOutsideProcessingHandler(svc manufacturing.OutsideProcessingService) OutsideProcessingHandler {
	return OutsideProcessingHandler{svc: svc}
}

type OutsideProcessingOrderResponse struct {
	ID                uint64    `json:"id"`
	ProductionOrderID uint64    `json:"production_order_id"`
	SupplierID        uint64    `json:"supplier_id"`
	PurchaseOrderID   *uint64   `json:"purchase_order_id"`
	State             string    `json:"state"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

func newOutsideProcessingOrderResponse(order *manufacturing.OutsideProcessingOrder) OutsideProcessingOrderResponse {
	return OutsideProcessingOrderResponse{
		ID:                order.ID,
		ProductionOrderID: order.ProductionOrderID,
		SupplierID:        order.SupplierID,
		PurchaseOrderID:   order.PurchaseOrderID,
		State:             order.State,
		CreatedAt:         order.CreatedAt,
		UpdatedAt:         order.UpdatedAt,
	}
}

type OutsideProcessingOrderEnvelope struct {
	httpx.EnvelopeBase
	Data OutsideProcessingOrderResponse `json:"data"`
}

var outsideProcessingQueryAllowlist = map[string]struct{}{
	"production_order_id": {},
	"supplier_id":         {},
	"purchase_order_id":   {},
	"state":               {},
	"created_at":          {},
	"updated_at":          {},
}

type ListOutsideProcessingOrdersResponse struct {
	Orders []OutsideProcessingOrderResponse `json:"orders"`
}

func (h OutsideProcessingHandler) List(c fiber.Ctx) error {
	parsedQuery, err := httpx.ParseQueryParams(c, outsideProcessingQueryAllowlist)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid query parameters.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	page, err := h.svc.ListInOrg(c, parsedQuery, organizationID)
	if err != nil {
		httpx.RequestLog(c).Error("outside processing list failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve outside processing orders.", err)
	}

	items := make([]OutsideProcessingOrderResponse, len(page.Items))
	for i, order := range page.Items {
		items[i] = newOutsideProcessingOrderResponse(order)
	}
	return httpx.CreateSuccessResponseWithMeta(c, "Outside processing orders retrieved successfully.", ListOutsideProcessingOrdersResponse{
		Orders: items,
	}, httpx.BuildListMeta(parsedQuery, page.Count))
}

func (h OutsideProcessingHandler) Get(c fiber.Ctx) error {
	orderID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid outside processing order id provided.", nil)
	}
	if err := h.ensureOrderInOrg(c, orderID); err != nil {
		return err
	}
	organizationID, _ := httpx.CallerOrganizationID(c)
	order, err := h.svc.FindInOrg(c, orderID, organizationID)
	if err != nil {
		return writeSubcontractError(c, err)
	}
	if order == nil {
		return httpx.CreateNotFoundResponse(c, "Outside processing order not found.")
	}
	return httpx.CreateSuccessResponse(c, "Outside processing order retrieved successfully.", newOutsideProcessingOrderResponse(order))
}
