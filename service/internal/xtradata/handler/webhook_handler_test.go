package handler

import (
	"context"
	"errors"
	"net/http"
	"testing"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/xtradata"
)

func webhookHandlerTest(t *testing.T, subscriptions xtradata.WebhookSubscriptionDAOMock, deliveries xtradata.WebhookDeliveryDAOMock) *fiber.App {
	t.Helper()
	app := fiber.New()
	h := NewWebhookSubscriptionHandler(xtradata.NewWebhookService(subscriptions, deliveries))
	h.Register(app, passthroughGuards())
	return app
}

func sampleWebhookSubscription() *xtradata.WebhookSubscription {
	return &xtradata.WebhookSubscription{
		Base:    model.Base{ID: 1},
		URL:     "https://example.com/hook",
		Enabled: true,
	}
}

func sampleWebhookDelivery() *xtradata.WebhookDelivery {
	code := 200
	return &xtradata.WebhookDelivery{
		Base:         model.Base{ID: 1},
		EventID:      5,
		Status:       xtradata.WebhookDeliveryStatusDelivered,
		Attempt:      1,
		ResponseCode: &code,
	}
}

func TestWebhookHandler_ListSubscriptions_ReturnsSubscriptions(t *testing.T) {
	app := webhookHandlerTest(t, xtradata.WebhookSubscriptionDAOMock{
		ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[xtradata.WebhookSubscription], error) {
			return &query.Page[xtradata.WebhookSubscription]{Items: []*xtradata.WebhookSubscription{sampleWebhookSubscription()}, Count: 1}, nil
		},
	}, xtradata.WebhookDeliveryDAOMock{})

	resp, err := doRequest(app, http.MethodGet, "/webhook-subscriptions/", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
}

func TestWebhookHandler_ListSubscriptions_ExportsCSV(t *testing.T) {
	app := webhookHandlerTest(t, xtradata.WebhookSubscriptionDAOMock{
		ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[xtradata.WebhookSubscription], error) {
			return &query.Page[xtradata.WebhookSubscription]{Items: []*xtradata.WebhookSubscription{sampleWebhookSubscription()}, Count: 1}, nil
		},
	}, xtradata.WebhookDeliveryDAOMock{})

	resp, err := doRequest(app, http.MethodGet, "/webhook-subscriptions/?format=csv", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
}

func TestWebhookHandler_ListSubscriptions_RejectsInvalidQuery(t *testing.T) {
	app := webhookHandlerTest(t, xtradata.WebhookSubscriptionDAOMock{}, xtradata.WebhookDeliveryDAOMock{})

	resp, err := doRequest(app, http.MethodGet, "/webhook-subscriptions/?filter=bogus:eq:x", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want 422", resp.StatusCode)
	}
}

func TestWebhookHandler_ListSubscriptions_ReturnsServerError(t *testing.T) {
	app := webhookHandlerTest(t, xtradata.WebhookSubscriptionDAOMock{
		ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[xtradata.WebhookSubscription], error) {
			return nil, errors.New("db down")
		},
	}, xtradata.WebhookDeliveryDAOMock{})

	resp, err := doRequest(app, http.MethodGet, "/webhook-subscriptions/", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500", resp.StatusCode)
	}
}

func TestWebhookHandler_CreateSubscription_Created(t *testing.T) {
	app := webhookHandlerTest(t, xtradata.WebhookSubscriptionDAOMock{}, xtradata.WebhookDeliveryDAOMock{})

	resp, err := doRequest(app, http.MethodPost, "/webhook-subscriptions/", `{"url":"https://example.com/hook","enabled":true}`)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("status = %d, want 201", resp.StatusCode)
	}
}

func TestWebhookHandler_CreateSubscription_ValidationError(t *testing.T) {
	app := webhookHandlerTest(t, xtradata.WebhookSubscriptionDAOMock{}, xtradata.WebhookDeliveryDAOMock{})

	resp, err := doRequest(app, http.MethodPost, "/webhook-subscriptions/", `{"url":""}`)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want 422", resp.StatusCode)
	}
}

func TestWebhookHandler_GetSubscription_NotFound(t *testing.T) {
	app := webhookHandlerTest(t, xtradata.WebhookSubscriptionDAOMock{}, xtradata.WebhookDeliveryDAOMock{})

	resp, err := doRequest(app, http.MethodGet, "/webhook-subscriptions/1", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", resp.StatusCode)
	}
}

func TestWebhookHandler_GetSubscription_Found(t *testing.T) {
	app := webhookHandlerTest(t, xtradata.WebhookSubscriptionDAOMock{
		FindFunc: func(_ context.Context, id uint64) (*xtradata.WebhookSubscription, error) {
			return sampleWebhookSubscription(), nil
		},
	}, xtradata.WebhookDeliveryDAOMock{})

	resp, err := doRequest(app, http.MethodGet, "/webhook-subscriptions/1", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
}

func TestWebhookHandler_GetSubscription_InvalidID(t *testing.T) {
	app := webhookHandlerTest(t, xtradata.WebhookSubscriptionDAOMock{}, xtradata.WebhookDeliveryDAOMock{})

	resp, err := doRequest(app, http.MethodGet, "/webhook-subscriptions/abc", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want 422", resp.StatusCode)
	}
}

func TestWebhookHandler_UpdateSubscription_OK(t *testing.T) {
	app := webhookHandlerTest(t, xtradata.WebhookSubscriptionDAOMock{
		FindFunc: func(_ context.Context, _ uint64) (*xtradata.WebhookSubscription, error) {
			return sampleWebhookSubscription(), nil
		},
	}, xtradata.WebhookDeliveryDAOMock{})

	resp, err := doRequest(app, http.MethodPut, "/webhook-subscriptions/1", `{"url":"https://example.com/hook","enabled":false}`)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
}

func TestWebhookHandler_DeleteSubscription_NoContent(t *testing.T) {
	app := webhookHandlerTest(t, xtradata.WebhookSubscriptionDAOMock{
		FindFunc: func(_ context.Context, _ uint64) (*xtradata.WebhookSubscription, error) {
			return sampleWebhookSubscription(), nil
		},
	}, xtradata.WebhookDeliveryDAOMock{})

	resp, err := doRequest(app, http.MethodDelete, "/webhook-subscriptions/1", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusNoContent {
		t.Fatalf("status = %d, want 204", resp.StatusCode)
	}
}

func TestWebhookHandler_DeleteSubscription_NotFound(t *testing.T) {
	app := webhookHandlerTest(t, xtradata.WebhookSubscriptionDAOMock{}, xtradata.WebhookDeliveryDAOMock{})

	resp, err := doRequest(app, http.MethodDelete, "/webhook-subscriptions/1", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", resp.StatusCode)
	}
}

func TestWebhookHandler_ListDeliveries_Returns(t *testing.T) {
	app := webhookHandlerTest(t, xtradata.WebhookSubscriptionDAOMock{}, xtradata.WebhookDeliveryDAOMock{
		ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[xtradata.WebhookDelivery], error) {
			return &query.Page[xtradata.WebhookDelivery]{Items: []*xtradata.WebhookDelivery{sampleWebhookDelivery()}, Count: 1}, nil
		},
	})

	resp, err := doRequest(app, http.MethodGet, "/webhook-deliveries/", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
}

func TestWebhookHandler_GetDelivery_NotFound(t *testing.T) {
	app := webhookHandlerTest(t, xtradata.WebhookSubscriptionDAOMock{}, xtradata.WebhookDeliveryDAOMock{})

	resp, err := doRequest(app, http.MethodGet, "/webhook-deliveries/1", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", resp.StatusCode)
	}
}

func TestWebhookHandler_GetDelivery_Found(t *testing.T) {
	app := webhookHandlerTest(t, xtradata.WebhookSubscriptionDAOMock{}, xtradata.WebhookDeliveryDAOMock{
		FindFunc: func(_ context.Context, _ uint64) (*xtradata.WebhookDelivery, error) {
			return sampleWebhookDelivery(), nil
		},
	})

	resp, err := doRequest(app, http.MethodGet, "/webhook-deliveries/1", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
}
