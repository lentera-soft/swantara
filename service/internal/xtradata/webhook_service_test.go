package xtradata

import (
	"context"
	"errors"
	"testing"

	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
)

func modelBaseFor(id uint64) model.Base {
	return model.Base{ID: id}
}

func TestWebhookService_CreateSubscription_TrimsURL(t *testing.T) {
	var created *WebhookSubscription
	svc := NewWebhookService(WebhookSubscriptionDAOMock{
		CreateFunc: func(_ context.Context, entity *WebhookSubscription) (*WebhookSubscription, error) {
			created = entity
			return entity, nil
		},
	}, WebhookDeliveryDAOMock{})

	subscription, err := svc.CreateSubscription(context.Background(), &WebhookSubscription{URL: "  https://example.com/hook  "})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if created.URL != "https://example.com/hook" || subscription.URL != "https://example.com/hook" {
		t.Fatalf("url = %q, want trimmed", subscription.URL)
	}
}

func TestWebhookService_CreateSubscription_RequiresURL(t *testing.T) {
	svc := NewWebhookService(WebhookSubscriptionDAOMock{}, WebhookDeliveryDAOMock{})

	if _, err := svc.CreateSubscription(context.Background(), &WebhookSubscription{URL: "   "}); !errors.Is(err, ErrWebhookURLRequired) {
		t.Fatalf("err = %v, want ErrWebhookURLRequired", err)
	}
}

func TestWebhookService_UpdateSubscription_NotFound(t *testing.T) {
	svc := NewWebhookService(WebhookSubscriptionDAOMock{
		FindFunc: func(_ context.Context, _ uint64) (*WebhookSubscription, error) { return nil, nil },
	}, WebhookDeliveryDAOMock{})

	if _, err := svc.UpdateSubscription(context.Background(), &WebhookSubscription{URL: "https://example.com/hook"}); !errors.Is(err, ErrWebhookSubscriptionMissing) {
		t.Fatalf("err = %v, want ErrWebhookSubscriptionMissing", err)
	}
}

func TestWebhookService_UpdateSubscription_Updates(t *testing.T) {
	svc := NewWebhookService(WebhookSubscriptionDAOMock{
		FindFunc: func(_ context.Context, _ uint64) (*WebhookSubscription, error) {
			return &WebhookSubscription{}, nil
		},
		UpdateFunc: func(_ context.Context, entity *WebhookSubscription) (*WebhookSubscription, error) {
			return entity, nil
		},
	}, WebhookDeliveryDAOMock{})

	updated, err := svc.UpdateSubscription(context.Background(), &WebhookSubscription{Base: modelBaseFor(7), URL: "https://example.com/hook", Enabled: true})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated.ID != 7 || !updated.Enabled {
		t.Fatalf("unexpected subscription: %+v", updated)
	}
}

func TestWebhookService_DeleteSubscription_NotFound(t *testing.T) {
	svc := NewWebhookService(WebhookSubscriptionDAOMock{
		FindFunc: func(_ context.Context, _ uint64) (*WebhookSubscription, error) { return nil, nil },
	}, WebhookDeliveryDAOMock{})

	if err := svc.DeleteSubscription(context.Background(), 1); !errors.Is(err, ErrWebhookSubscriptionMissing) {
		t.Fatalf("err = %v, want ErrWebhookSubscriptionMissing", err)
	}
}

func TestWebhookService_ListSubscriptions(t *testing.T) {
	want := &query.Page[WebhookSubscription]{Count: 2}
	svc := NewWebhookService(WebhookSubscriptionDAOMock{
		ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[WebhookSubscription], error) {
			return want, nil
		},
	}, WebhookDeliveryDAOMock{})

	got, err := svc.ListSubscriptions(context.Background(), &query.Query{})
	if err != nil || got.Count != 2 {
		t.Fatalf("got = %+v, err = %v", got, err)
	}
}

func TestWebhookService_FindSubscription(t *testing.T) {
	svc := NewWebhookService(WebhookSubscriptionDAOMock{
		FindFunc: func(_ context.Context, id uint64) (*WebhookSubscription, error) {
			return &WebhookSubscription{Base: modelBaseFor(id)}, nil
		},
	}, WebhookDeliveryDAOMock{})

	got, err := svc.FindSubscription(context.Background(), 3)
	if err != nil || got.ID != 3 {
		t.Fatalf("got = %+v, err = %v", got, err)
	}
}

func TestWebhookService_ListDeliveries(t *testing.T) {
	svc := NewWebhookService(WebhookSubscriptionDAOMock{}, WebhookDeliveryDAOMock{
		ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[WebhookDelivery], error) {
			return &query.Page[WebhookDelivery]{Count: 1}, nil
		},
	})

	got, err := svc.ListDeliveries(context.Background(), &query.Query{})
	if err != nil || got.Count != 1 {
		t.Fatalf("got = %+v, err = %v", got, err)
	}
}

func TestWebhookService_FindDelivery(t *testing.T) {
	svc := NewWebhookService(WebhookSubscriptionDAOMock{}, WebhookDeliveryDAOMock{
		FindFunc: func(_ context.Context, id uint64) (*WebhookDelivery, error) {
			return &WebhookDelivery{Base: modelBaseFor(id)}, nil
		},
	})

	got, err := svc.FindDelivery(context.Background(), 9)
	if err != nil || got.ID != 9 {
		t.Fatalf("got = %+v, err = %v", got, err)
	}
}
