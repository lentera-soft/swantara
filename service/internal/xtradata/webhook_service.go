package xtradata

import (
	"context"
	"strings"

	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/kernel/scope"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type WebhookService struct {
	subscriptions WebhookSubscriptionDAO
	deliveries    WebhookDeliveryDAO
}

func NewWebhookService(subscriptions WebhookSubscriptionDAO, deliveries WebhookDeliveryDAO) WebhookService {
	return WebhookService{subscriptions: subscriptions, deliveries: deliveries}
}

func (s WebhookService) ListSubscriptions(ctx context.Context, q *query.Query) (*query.Page[WebhookSubscription], error) {
	return s.subscriptions.List(ctx, q)
}

func (s WebhookService) FindSubscription(ctx context.Context, id uint64) (*WebhookSubscription, error) {
	return s.subscriptions.Find(ctx, id)
}

func (s WebhookService) CreateSubscription(ctx context.Context, subscription *WebhookSubscription) (*WebhookSubscription, error) {
	if err := normalizeWebhookSubscription(subscription); err != nil {
		return nil, err
	}
	return s.subscriptions.Create(ctx, subscription)
}

func (s WebhookService) UpdateSubscription(ctx context.Context, subscription *WebhookSubscription) (*WebhookSubscription, error) {
	if err := normalizeWebhookSubscription(subscription); err != nil {
		return nil, err
	}
	existing, err := s.subscriptions.Find(ctx, subscription.ID)
	if err != nil {
		return nil, dao.NotFound(err, ErrWebhookSubscriptionMissing)
	}
	if existing == nil {
		return nil, ErrWebhookSubscriptionMissing
	}
	return s.subscriptions.Update(ctx, subscription)
}

func (s WebhookService) DeleteSubscription(ctx context.Context, id uint64) error {
	existing, err := s.subscriptions.Find(ctx, id)
	if err != nil {
		return dao.NotFound(err, ErrWebhookSubscriptionMissing)
	}
	if existing == nil {
		return ErrWebhookSubscriptionMissing
	}
	return s.subscriptions.Delete(ctx, id)
}

func (s WebhookService) ListDeliveries(ctx context.Context, q *query.Query) (*query.Page[WebhookDelivery], error) {
	return s.deliveries.List(ctx, q)
}

func (s WebhookService) FindDelivery(ctx context.Context, id uint64) (*WebhookDelivery, error) {
	return s.deliveries.Find(ctx, id)
}

func normalizeWebhookSubscription(subscription *WebhookSubscription) error {
	subscription.URL = strings.TrimSpace(subscription.URL)
	if subscription.URL == "" {
		return ErrWebhookURLRequired
	}
	return nil
}

func (s WebhookService) ListSubscriptionsInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[WebhookSubscription], error) {
	return s.subscriptions.List(ctx, scope.ToOrg(q, organizationID))
}

func (s WebhookService) ListDeliveriesInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[WebhookDelivery], error) {
	return s.deliveries.List(ctx, scope.ToOrg(q, organizationID))
}
