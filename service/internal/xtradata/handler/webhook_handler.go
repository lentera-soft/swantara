package handler

import (
	"time"

	"github.com/jalusw/swantara/apps/service/internal/xtradata"
)

type WebhookSubscriptionHandler struct {
	webhookSvc xtradata.WebhookService
}

func NewWebhookSubscriptionHandler(webhookSvc xtradata.WebhookService) WebhookSubscriptionHandler {
	return WebhookSubscriptionHandler{webhookSvc: webhookSvc}
}

type WebhookSubscriptionResponse struct {
	ID             uint64    `json:"id"`
	OrganizationID *uint64   `json:"organization_id"`
	URL            string    `json:"url"`
	Enabled        bool      `json:"enabled"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func newWebhookSubscriptionResponse(subscription *xtradata.WebhookSubscription) WebhookSubscriptionResponse {
	return WebhookSubscriptionResponse{
		ID:             subscription.ID,
		OrganizationID: subscription.OrganizationID,
		URL:            subscription.URL,
		Enabled:        subscription.Enabled,
		CreatedAt:      subscription.CreatedAt,
		UpdatedAt:      subscription.UpdatedAt,
	}
}

type WebhookDeliveryResponse struct {
	ID             uint64     `json:"id"`
	EventID        uint64     `json:"event_id"`
	SubscriptionID *uint64    `json:"subscription_id"`
	OrganizationID *uint64    `json:"organization_id"`
	Status         string     `json:"status"`
	Attempt        int        `json:"attempt"`
	ResponseCode   *int       `json:"response_code"`
	Error          *string    `json:"error"`
	DeliveredAt    *time.Time `json:"delivered_at"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

func newWebhookDeliveryResponse(delivery *xtradata.WebhookDelivery) WebhookDeliveryResponse {
	return WebhookDeliveryResponse{
		ID:             delivery.ID,
		EventID:        delivery.EventID,
		SubscriptionID: delivery.SubscriptionID,
		OrganizationID: delivery.OrganizationID,
		Status:         delivery.Status,
		Attempt:        delivery.Attempt,
		ResponseCode:   delivery.ResponseCode,
		Error:          delivery.Error,
		DeliveredAt:    delivery.DeliveredAt,
		CreatedAt:      delivery.CreatedAt,
		UpdatedAt:      delivery.UpdatedAt,
	}
}

var webhookSubscriptionQueryAllowlist = map[string]struct{}{
	"url":             {},
	"enabled":         {},
	"organization_id": {},
	"created_at":      {},
	"updated_at":      {},
}

var webhookDeliveryQueryAllowlist = map[string]struct{}{
	"event_id":        {},
	"subscription_id": {},
	"status":          {},
	"attempt":         {},
	"organization_id": {},
	"created_at":      {},
	"updated_at":      {},
}
