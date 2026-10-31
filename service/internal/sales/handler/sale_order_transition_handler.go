package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
)

func (h SaleOrderHandler) ensureOrderInOrg(c fiber.Ctx, orderID uint64) error {
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	order, err := h.svc.FindInOrg(c, orderID, organizationID)
	if err != nil {
		return writeSaleOrderError(c, err)
	}
	if order == nil {
		return httpx.CreateNotFoundResponse(c, "Sale order not found.")
	}
	return nil
}

// @Summary Send sale order
// @Description Sends a draft sale order, moving it from draft to sent so the customer can review and confirm it. Only draft orders can be sent; otherwise a conflict is returned.
// @Tags Sale Orders
// @Accept json
// @Produce json
// @Param id path integer true "Sale order ID"
// @Success 200 {object} GetSaleOrderResponseEnvelope "Sale order sent successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Sale order not found"
// @Failure 409 {object} httpx.ErrorResponse "Sale order cannot be sent in its current state"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/sale-orders/{id}/send [post]
func (h SaleOrderHandler) Send(c fiber.Ctx) error {
	orderID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid sale order id provided.", nil)
	}

	if err := h.ensureOrderInOrg(c, orderID); err != nil {
		return err
	}
	order, err := h.svc.Send(c, orderID)
	if err != nil {
		return writeSaleOrderError(c, err)
	}

	return httpx.CreateSuccessResponse(c, "Sale order sent successfully.", GetSaleOrderResponse{
		Order: newSaleOrderResponse(order),
	})
}

// @Summary Confirm sale order
// @Description Confirms a draft or sent sale order by checking stock availability, reserving quantities, and generating the outgoing shipment with its stock movements. Confirmation fails with a conflict when stock is insufficient or the order is not in a confirmable state.
// @Tags Sale Orders
// @Accept json
// @Produce json
// @Param id path integer true "Sale order ID"
// @Success 200 {object} GetSaleOrderResponseEnvelope "Sale order confirmed successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Sale order not found"
// @Failure 409 {object} httpx.ErrorResponse "Sale order cannot be confirmed or insufficient stock"
// @Failure 422 {object} httpx.ErrorResponse "Validation error or missing configuration"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/sale-orders/{id}/confirm [post]
func (h SaleOrderHandler) Confirm(c fiber.Ctx) error {
	orderID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid sale order id provided.", nil)
	}

	if err := h.ensureOrderInOrg(c, orderID); err != nil {
		return err
	}
	actorID, _ := httpx.CallerID(c)
	order, err := h.svc.Confirm(model.ContextWithActor(c, actorID), orderID)
	if err != nil {
		return writeSaleOrderError(c, err)
	}

	return httpx.CreateSuccessResponse(c, "Sale order confirmed successfully.", GetSaleOrderResponse{
		Order: newSaleOrderResponse(order),
	})
}

// @Summary Cancel sale order
// @Description Cancels a draft, sent, or confirmed sale order, releasing any stock reservations and cancelling the order's shipments and their movements. Orders already marked done cannot be cancelled.
// @Tags Sale Orders
// @Accept json
// @Produce json
// @Param id path integer true "Sale order ID"
// @Success 200 {object} GetSaleOrderResponseEnvelope "Sale order cancelled successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Sale order not found"
// @Failure 409 {object} httpx.ErrorResponse "Sale order cannot be cancelled in its current state"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/sale-orders/{id}/cancel [post]
func (h SaleOrderHandler) Cancel(c fiber.Ctx) error {
	orderID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid sale order id provided.", nil)
	}

	if err := h.ensureOrderInOrg(c, orderID); err != nil {
		return err
	}
	order, err := h.svc.Cancel(c, orderID)
	if err != nil {
		return writeSaleOrderError(c, err)
	}

	return httpx.CreateSuccessResponse(c, "Sale order cancelled successfully.", GetSaleOrderResponse{
		Order: newSaleOrderResponse(order),
	})
}

// @Summary Mark sale order done
// @Description Marks a confirmed sale order as done, completing the order lifecycle. Only confirmed orders can be marked done.
// @Tags Sale Orders
// @Accept json
// @Produce json
// @Param id path integer true "Sale order ID"
// @Success 200 {object} GetSaleOrderResponseEnvelope "Sale order marked done successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Sale order not found"
// @Failure 409 {object} httpx.ErrorResponse "Sale order cannot be marked done in its current state"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/sale-orders/{id}/complete [post]
func (h SaleOrderHandler) Done(c fiber.Ctx) error {
	orderID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid sale order id provided.", nil)
	}

	if err := h.ensureOrderInOrg(c, orderID); err != nil {
		return err
	}
	order, err := h.svc.Done(c, orderID)
	if err != nil {
		return writeSaleOrderError(c, err)
	}

	return httpx.CreateSuccessResponse(c, "Sale order marked done successfully.", GetSaleOrderResponse{
		Order: newSaleOrderResponse(order),
	})
}

// @Summary Recompute sale order statuses
// @Description Recomputes the delivery and invoice statuses of a sale order from the ordered, delivered, and invoiced quantities on its lines, deriving pending, partial, done, and invoiced statuses accordingly.
// @Tags Sale Orders
// @Accept json
// @Produce json
// @Param id path integer true "Sale order ID"
// @Success 200 {object} GetSaleOrderResponseEnvelope "Sale order statuses recomputed successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Sale order not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/sale-orders/{id}/recompute-statuses [post]
func (h SaleOrderHandler) RecomputeStatuses(c fiber.Ctx) error {
	orderID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid sale order id provided.", nil)
	}

	if err := h.ensureOrderInOrg(c, orderID); err != nil {
		return err
	}
	order, err := h.svc.RecomputeStatuses(c, orderID)
	if err != nil {
		return writeSaleOrderError(c, err)
	}

	return httpx.CreateSuccessResponse(c, "Sale order statuses recomputed successfully.", GetSaleOrderResponse{
		Order: newSaleOrderResponse(order),
	})
}
