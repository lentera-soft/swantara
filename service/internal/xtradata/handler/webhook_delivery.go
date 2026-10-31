package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type ListWebhookDeliveriesResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ListWebhookDeliveriesResponse `json:"data"`
}

type ListWebhookDeliveriesResponse struct {
	WebhookDeliveries []WebhookDeliveryResponse `json:"webhook_deliveries"`
}

// @Summary List webhook deliveries
// @Description Returns the organization's webhook delivery history: one record per integration event delivered to a subscription, capturing the outcome of the delivery and its retries. A record has status "delivered" when the endpoint replied with a 2xx (response_code and delivered_at are populated) or "failed" when delivery gave up after the retry cap (error holds the last failure and attempt is the number of attempts made). Results are always scoped to the caller's organization and can be narrowed by status, event_id, or subscription_id.
// @Tags Webhook Deliveries
// @Accept json
// @Produce json
// @Param page query integer false "Page number" default(1)
// @Param size query integer false "Items per page (max 100)" default(20)
// @Param sort query string false "Sort fields (comma separated, e.g. created_at:desc)"
// @Param filter query string false "Filters (repeatable, e.g. status:eq:failed)"
// @Param format query string false "Response format" Enums(json, xml, csv)
// @Success 200 {object} ListWebhookDeliveriesResponseEnvelope "Webhook deliveries retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 422 {object} httpx.ErrorResponse "Invalid query parameters"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/webhook-deliveries [get]
func (h WebhookSubscriptionHandler) ListDeliveries(c fiber.Ctx) error {
	parsedQuery, err := httpx.ParseQueryParams(c, webhookDeliveryQueryAllowlist)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid query parameters.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	page, err := h.webhookSvc.ListDeliveriesInOrg(c, parsedQuery, organizationID)
	if err != nil {
		httpx.RequestLog(c).Error("webhook delivery list failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve webhook deliveries.", err)
	}

	items := make([]WebhookDeliveryResponse, len(page.Items))
	for i, delivery := range page.Items {
		items[i] = newWebhookDeliveryResponse(delivery)
	}

	if httpx.RequestFormat(c) == httpx.FormatCSV {
		return httpx.ExportCSV(c, fiber.StatusOK, "webhook-deliveries.csv", items)
	}

	return httpx.CreateSuccessResponseWithMeta(c, "Webhook deliveries retrieved successfully.", ListWebhookDeliveriesResponse{
		WebhookDeliveries: items,
	}, httpx.BuildListMeta(parsedQuery, page.Count))
}

type GetWebhookDeliveryResponseEnvelope struct {
	httpx.EnvelopeBase
	Data GetWebhookDeliveryResponse `json:"data"`
}

type GetWebhookDeliveryResponse struct {
	WebhookDelivery WebhookDeliveryResponse `json:"webhook_delivery"`
}

// @Summary Get webhook delivery
// @Description Returns a single webhook delivery attempt by id; a non-numeric id yields a 422.
// @Tags Webhook Deliveries
// @Accept json
// @Produce json
// @Param id path integer true "Webhook delivery ID"
// @Success 200 {object} GetWebhookDeliveryResponseEnvelope "Webhook delivery retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Webhook delivery not found"
// @Failure 422 {object} httpx.ErrorResponse "Invalid id"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/webhook-deliveries/{id} [get]
func (h WebhookSubscriptionHandler) GetDelivery(c fiber.Ctx) error {
	deliveryID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid webhook delivery id provided.", nil)
	}

	delivery, err := h.webhookSvc.FindDelivery(c, deliveryID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "Webhook delivery not found.")
		}
		httpx.RequestLog(c).Error("webhook delivery lookup failed", "delivery_id", deliveryID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve webhook delivery.", err)
	}
	if delivery == nil {
		return httpx.CreateNotFoundResponse(c, "Webhook delivery not found.")
	}

	return httpx.CreateSuccessResponse(c, "Webhook delivery retrieved successfully.", GetWebhookDeliveryResponse{
		WebhookDelivery: newWebhookDeliveryResponse(delivery),
	})
}
