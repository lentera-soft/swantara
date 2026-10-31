package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/xtradata"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type CreateWebhookSubscriptionRequest struct {
	URL     string `json:"url" validate:"required,url" example:"https://example.com/webhooks"`
	Secret  string `json:"secret" example:"whsec_123"`
	Enabled *bool  `json:"enabled"`
}

type CreateWebhookSubscriptionResponseEnvelope struct {
	httpx.EnvelopeBase
	Data CreateWebhookSubscriptionResponse `json:"data"`
}

type CreateWebhookSubscriptionResponse struct {
	WebhookSubscription WebhookSubscriptionResponse `json:"webhook_subscription"`
}

// @Summary Create webhook subscription
// @Description Registers an HTTPS endpoint that will receive signed integration event deliveries for the organization.
// @Tags Webhook Subscriptions
// @Accept json
// @Produce json
// @Param body body CreateWebhookSubscriptionRequest true "Webhook subscription details"
// @Success 201 {object} CreateWebhookSubscriptionResponseEnvelope "Webhook subscription created successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/webhook-subscriptions [post]
func (h WebhookSubscriptionHandler) Create(c fiber.Ctx) error {
	var request CreateWebhookSubscriptionRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}

	enabled := true
	if request.Enabled != nil {
		enabled = *request.Enabled
	}

	subscription, err := h.webhookSvc.CreateSubscription(c, &xtradata.WebhookSubscription{
		OrganizationID: httpx.TenantOrganizationID(c, nil),
		URL:            request.URL,
		Secret:         request.Secret,
		Enabled:        enabled,
	})
	if err != nil {
		return writeWebhookSubscriptionError(c, err)
	}

	return httpx.CreateCreatedResponse(c, "Webhook subscription created successfully.", CreateWebhookSubscriptionResponse{
		WebhookSubscription: newWebhookSubscriptionResponse(subscription),
	})
}

type ListWebhookSubscriptionsResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ListWebhookSubscriptionsResponse `json:"data"`
}

type ListWebhookSubscriptionsResponse struct {
	WebhookSubscriptions []WebhookSubscriptionResponse `json:"webhook_subscriptions"`
}

// @Summary List webhook subscriptions
// @Description Returns the organization's webhook subscriptions: the HTTPS endpoints registered to receive signed integration event deliveries. Each entry reports its target url, whether it is enabled, and when it was created or last updated. Results are always scoped to the caller's organization and can be narrowed by url or enabled state.
// @Tags Webhook Subscriptions
// @Accept json
// @Produce json
// @Param page query integer false "Page number" default(1)
// @Param size query integer false "Items per page (max 100)" default(20)
// @Param sort query string false "Sort fields (comma separated, e.g. created_at:desc)"
// @Param filter query string false "Filters (repeatable, e.g. enabled:eq:true)"
// @Param format query string false "Response format" Enums(json, xml, csv)
// @Success 200 {object} ListWebhookSubscriptionsResponseEnvelope "Webhook subscriptions retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 422 {object} httpx.ErrorResponse "Invalid query parameters"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/webhook-subscriptions [get]
func (h WebhookSubscriptionHandler) List(c fiber.Ctx) error {
	parsedQuery, err := httpx.ParseQueryParams(c, webhookSubscriptionQueryAllowlist)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid query parameters.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	page, err := h.webhookSvc.ListSubscriptionsInOrg(c, parsedQuery, organizationID)
	if err != nil {
		httpx.RequestLog(c).Error("webhook subscription list failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve webhook subscriptions.", err)
	}

	items := make([]WebhookSubscriptionResponse, len(page.Items))
	for i, subscription := range page.Items {
		items[i] = newWebhookSubscriptionResponse(subscription)
	}

	if httpx.RequestFormat(c) == httpx.FormatCSV {
		return httpx.ExportCSV(c, fiber.StatusOK, "webhook-subscriptions.csv", items)
	}

	return httpx.CreateSuccessResponseWithMeta(c, "Webhook subscriptions retrieved successfully.", ListWebhookSubscriptionsResponse{
		WebhookSubscriptions: items,
	}, httpx.BuildListMeta(parsedQuery, page.Count))
}

type GetWebhookSubscriptionResponseEnvelope struct {
	httpx.EnvelopeBase
	Data GetWebhookSubscriptionResponse `json:"data"`
}

type GetWebhookSubscriptionResponse struct {
	WebhookSubscription WebhookSubscriptionResponse `json:"webhook_subscription"`
}

// @Summary Get webhook subscription
// @Description Returns a single webhook subscription by id; a non-numeric id yields a 422.
// @Tags Webhook Subscriptions
// @Accept json
// @Produce json
// @Param id path integer true "Webhook subscription ID"
// @Success 200 {object} GetWebhookSubscriptionResponseEnvelope "Webhook subscription retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Webhook subscription not found"
// @Failure 422 {object} httpx.ErrorResponse "Invalid id"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/webhook-subscriptions/{id} [get]
func (h WebhookSubscriptionHandler) Get(c fiber.Ctx) error {
	subscriptionID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid webhook subscription id provided.", nil)
	}

	subscription, err := h.webhookSvc.FindSubscription(c, subscriptionID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "Webhook subscription not found.")
		}
		httpx.RequestLog(c).Error("webhook subscription lookup failed", "subscription_id", subscriptionID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve webhook subscription.", err)
	}
	if subscription == nil {
		return httpx.CreateNotFoundResponse(c, "Webhook subscription not found.")
	}

	return httpx.CreateSuccessResponse(c, "Webhook subscription retrieved successfully.", GetWebhookSubscriptionResponse{
		WebhookSubscription: newWebhookSubscriptionResponse(subscription),
	})
}

type UpdateWebhookSubscriptionRequest struct {
	URL     string `json:"url" validate:"required,url" example:"https://example.com/webhooks"`
	Secret  string `json:"secret"`
	Enabled *bool  `json:"enabled"`
}

type UpdateWebhookSubscriptionResponseEnvelope struct {
	httpx.EnvelopeBase
	Data UpdateWebhookSubscriptionResponse `json:"data"`
}

type UpdateWebhookSubscriptionResponse struct {
	WebhookSubscription WebhookSubscriptionResponse `json:"webhook_subscription"`
}

// @Summary Update webhook subscription
// @Description Updates a webhook subscription's url, secret, or enabled flag by id; a non-numeric id yields a 422.
// @Tags Webhook Subscriptions
// @Accept json
// @Produce json
// @Param id path integer true "Webhook subscription ID"
// @Param body body UpdateWebhookSubscriptionRequest true "Webhook subscription details"
// @Success 200 {object} UpdateWebhookSubscriptionResponseEnvelope "Webhook subscription updated successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Webhook subscription not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error or invalid id"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/webhook-subscriptions/{id} [put]
func (h WebhookSubscriptionHandler) Update(c fiber.Ctx) error {
	subscriptionID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid webhook subscription id provided.", nil)
	}

	var request UpdateWebhookSubscriptionRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}

	subscription, err := h.webhookSvc.FindSubscription(c, subscriptionID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "Webhook subscription not found.")
		}
		httpx.RequestLog(c).Error("webhook subscription lookup failed", "subscription_id", subscriptionID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to update webhook subscription.", err)
	}
	if subscription == nil {
		return httpx.CreateNotFoundResponse(c, "Webhook subscription not found.")
	}

	subscription.URL = request.URL
	if request.Secret != "" {
		subscription.Secret = request.Secret
	}
	if request.Enabled != nil {
		subscription.Enabled = *request.Enabled
	}

	updated, err := h.webhookSvc.UpdateSubscription(c, subscription)
	if err != nil {
		return writeWebhookSubscriptionError(c, err)
	}

	return httpx.CreateSuccessResponse(c, "Webhook subscription updated successfully.", UpdateWebhookSubscriptionResponse{
		WebhookSubscription: newWebhookSubscriptionResponse(updated),
	})
}

// @Summary Delete webhook subscription
// @Description Deletes a webhook subscription by id.
// @Tags Webhook Subscriptions
// @Accept json
// @Produce json
// @Param id path integer true "Webhook subscription ID"
// @Success 204 "No Content"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Webhook subscription not found"
// @Failure 422 {object} httpx.ErrorResponse "Invalid id"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/webhook-subscriptions/{id} [delete]
func (h WebhookSubscriptionHandler) Delete(c fiber.Ctx) error {
	subscriptionID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid webhook subscription id provided.", nil)
	}

	if err := h.webhookSvc.DeleteSubscription(c, subscriptionID); err != nil {
		return writeWebhookSubscriptionError(c, err)
	}

	return httpx.CreateNoContentResponse(c)
}
