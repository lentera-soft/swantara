//go:build test

package xtradata

import (
	"context"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type SystemConfigDAOMock struct {
	ListFunc   func(ctx context.Context, q *query.Query) (*query.Page[reference.SystemConfig], error)
	FindFunc   func(ctx context.Context, id uint64) (*reference.SystemConfig, error)
	CreateFunc func(ctx context.Context, entity *reference.SystemConfig) (*reference.SystemConfig, error)
	SearchFunc func(ctx context.Context, field string, value any) (*reference.SystemConfig, error)
	DeleteFunc func(ctx context.Context, id uint64) error
	UpdateFunc func(ctx context.Context, entity *reference.SystemConfig) (*reference.SystemConfig, error)
}

func (m SystemConfigDAOMock) List(ctx context.Context, q *query.Query) (*query.Page[reference.SystemConfig], error) {
	if m.ListFunc != nil {
		return m.ListFunc(ctx, q)
	}
	return nil, nil
}

func (m SystemConfigDAOMock) ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[reference.SystemConfig], error) {
	return m.List(ctx, q)
}

func (m SystemConfigDAOMock) Find(ctx context.Context, id uint64) (*reference.SystemConfig, error) {
	if m.FindFunc != nil {
		return m.FindFunc(ctx, id)
	}
	return nil, nil
}

func (m SystemConfigDAOMock) FindInOrg(ctx context.Context, id, organizationID uint64) (*reference.SystemConfig, error) {
	return m.Find(ctx, id)
}

func (m SystemConfigDAOMock) Create(ctx context.Context, entity *reference.SystemConfig) (*reference.SystemConfig, error) {
	if m.CreateFunc != nil {
		return m.CreateFunc(ctx, entity)
	}
	return entity, nil
}

func (m SystemConfigDAOMock) Update(ctx context.Context, entity *reference.SystemConfig) (*reference.SystemConfig, error) {
	if m.UpdateFunc != nil {
		return m.UpdateFunc(ctx, entity)
	}
	return entity, nil
}

func (m SystemConfigDAOMock) Delete(ctx context.Context, id uint64) error {
	if m.DeleteFunc != nil {
		return m.DeleteFunc(ctx, id)
	}
	return nil
}

func (m SystemConfigDAOMock) HardDelete(ctx context.Context, id uint64) error { return nil }

func (m SystemConfigDAOMock) Search(ctx context.Context, field string, value any) (*reference.SystemConfig, error) {
	if m.SearchFunc != nil {
		return m.SearchFunc(ctx, field, value)
	}
	return nil, nil
}

type IntegrationEventDAOMock struct {
	ListFunc   func(ctx context.Context, q *query.Query) (*query.Page[IntegrationEvent], error)
	CreateFunc func(ctx context.Context, entity *IntegrationEvent) (*IntegrationEvent, error)
	FindFunc   func(ctx context.Context, id uint64) (*IntegrationEvent, error)
	UpdateFunc func(ctx context.Context, entity *IntegrationEvent) (*IntegrationEvent, error)
}

func (m IntegrationEventDAOMock) List(ctx context.Context, q *query.Query) (*query.Page[IntegrationEvent], error) {
	if m.ListFunc != nil {
		return m.ListFunc(ctx, q)
	}
	return nil, nil
}

func (m IntegrationEventDAOMock) Find(ctx context.Context, id uint64) (*IntegrationEvent, error) {
	if m.FindFunc != nil {
		return m.FindFunc(ctx, id)
	}
	return nil, nil
}

func (m IntegrationEventDAOMock) Create(ctx context.Context, entity *IntegrationEvent) (*IntegrationEvent, error) {
	if m.CreateFunc != nil {
		return m.CreateFunc(ctx, entity)
	}
	return entity, nil
}

func (m IntegrationEventDAOMock) Update(ctx context.Context, entity *IntegrationEvent) (*IntegrationEvent, error) {
	if m.UpdateFunc != nil {
		return m.UpdateFunc(ctx, entity)
	}
	return entity, nil
}

func (m IntegrationEventDAOMock) Delete(ctx context.Context, id uint64) error { return nil }

func (m IntegrationEventDAOMock) HardDelete(ctx context.Context, id uint64) error { return nil }

func (m IntegrationEventDAOMock) Search(ctx context.Context, field string, value any) (*IntegrationEvent, error) {
	return nil, nil
}

type IdempotencyKeyDAOMock struct {
	CreateFunc     func(ctx context.Context, entity *IdempotencyKey) (*IdempotencyKey, error)
	ClaimFn        func(ctx context.Context, organizationID *uint64, key, resource string) (bool, *IdempotencyKey, error)
	CompleteFn     func(ctx context.Context, organizationID *uint64, key string, statusCode int, response []byte) error
	ReleaseFn      func(ctx context.Context, organizationID *uint64, key string) error
	PurgeExpiredFn func(ctx context.Context, now time.Time) (int64, error)
}

func (m IdempotencyKeyDAOMock) List(ctx context.Context, q *query.Query) (*query.Page[IdempotencyKey], error) {
	return nil, nil
}

func (m IdempotencyKeyDAOMock) Find(ctx context.Context, id uint64) (*IdempotencyKey, error) {
	return nil, nil
}

func (m IdempotencyKeyDAOMock) Create(ctx context.Context, entity *IdempotencyKey) (*IdempotencyKey, error) {
	if m.CreateFunc != nil {
		return m.CreateFunc(ctx, entity)
	}
	return entity, nil
}

func (m IdempotencyKeyDAOMock) Update(ctx context.Context, entity *IdempotencyKey) (*IdempotencyKey, error) {
	return entity, nil
}

func (m IdempotencyKeyDAOMock) Delete(ctx context.Context, id uint64) error { return nil }

func (m IdempotencyKeyDAOMock) HardDelete(ctx context.Context, id uint64) error { return nil }

func (m IdempotencyKeyDAOMock) Search(ctx context.Context, field string, value any) (*IdempotencyKey, error) {
	return nil, nil
}

func (m IdempotencyKeyDAOMock) Claim(ctx context.Context, organizationID *uint64, key, resource string) (bool, *IdempotencyKey, error) {
	if m.ClaimFn != nil {
		return m.ClaimFn(ctx, organizationID, key, resource)
	}
	return true, nil, nil
}

func (m IdempotencyKeyDAOMock) Complete(ctx context.Context, organizationID *uint64, key string, statusCode int, response []byte) error {
	if m.CompleteFn != nil {
		return m.CompleteFn(ctx, organizationID, key, statusCode, response)
	}
	return nil
}

func (m IdempotencyKeyDAOMock) Release(ctx context.Context, organizationID *uint64, key string) error {
	if m.ReleaseFn != nil {
		return m.ReleaseFn(ctx, organizationID, key)
	}
	return nil
}

func (m IdempotencyKeyDAOMock) PurgeExpired(ctx context.Context, now time.Time) (int64, error) {
	if m.PurgeExpiredFn != nil {
		return m.PurgeExpiredFn(ctx, now)
	}
	return 0, nil
}

type WebhookSubscriptionDAOMock struct {
	ListEnabledForOrgFn func(ctx context.Context, organizationID *uint64) ([]*WebhookSubscription, error)
	ListFunc            func(ctx context.Context, q *query.Query) (*query.Page[WebhookSubscription], error)
	FindFunc            func(ctx context.Context, id uint64) (*WebhookSubscription, error)
	CreateFunc          func(ctx context.Context, entity *WebhookSubscription) (*WebhookSubscription, error)
	UpdateFunc          func(ctx context.Context, entity *WebhookSubscription) (*WebhookSubscription, error)
	DeleteFunc          func(ctx context.Context, id uint64) error
}

func (m WebhookSubscriptionDAOMock) List(ctx context.Context, q *query.Query) (*query.Page[WebhookSubscription], error) {
	if m.ListFunc != nil {
		return m.ListFunc(ctx, q)
	}
	return nil, nil
}

func (m WebhookSubscriptionDAOMock) Find(ctx context.Context, id uint64) (*WebhookSubscription, error) {
	if m.FindFunc != nil {
		return m.FindFunc(ctx, id)
	}
	return nil, nil
}

func (m WebhookSubscriptionDAOMock) Create(ctx context.Context, entity *WebhookSubscription) (*WebhookSubscription, error) {
	if m.CreateFunc != nil {
		return m.CreateFunc(ctx, entity)
	}
	return entity, nil
}

func (m WebhookSubscriptionDAOMock) Update(ctx context.Context, entity *WebhookSubscription) (*WebhookSubscription, error) {
	if m.UpdateFunc != nil {
		return m.UpdateFunc(ctx, entity)
	}
	return entity, nil
}

func (m WebhookSubscriptionDAOMock) Delete(ctx context.Context, id uint64) error {
	if m.DeleteFunc != nil {
		return m.DeleteFunc(ctx, id)
	}
	return nil
}

func (m WebhookSubscriptionDAOMock) HardDelete(ctx context.Context, id uint64) error { return nil }

func (m WebhookSubscriptionDAOMock) Search(ctx context.Context, field string, value any) (*WebhookSubscription, error) {
	return nil, nil
}

func (m WebhookSubscriptionDAOMock) ListEnabledForOrg(ctx context.Context, organizationID *uint64) ([]*WebhookSubscription, error) {
	if m.ListEnabledForOrgFn != nil {
		return m.ListEnabledForOrgFn(ctx, organizationID)
	}
	return nil, nil
}

type WebhookDeliveryDAOMock struct {
	CreateFunc          func(ctx context.Context, entity *WebhookDelivery) (*WebhookDelivery, error)
	DeliveredForEventFn func(ctx context.Context, eventID uint64) ([]*WebhookDelivery, error)
	ListFunc            func(ctx context.Context, q *query.Query) (*query.Page[WebhookDelivery], error)
	FindFunc            func(ctx context.Context, id uint64) (*WebhookDelivery, error)
}

func (m WebhookDeliveryDAOMock) List(ctx context.Context, q *query.Query) (*query.Page[WebhookDelivery], error) {
	if m.ListFunc != nil {
		return m.ListFunc(ctx, q)
	}
	return nil, nil
}

func (m WebhookDeliveryDAOMock) Find(ctx context.Context, id uint64) (*WebhookDelivery, error) {
	if m.FindFunc != nil {
		return m.FindFunc(ctx, id)
	}
	return nil, nil
}

func (m WebhookDeliveryDAOMock) Create(ctx context.Context, entity *WebhookDelivery) (*WebhookDelivery, error) {
	if m.CreateFunc != nil {
		return m.CreateFunc(ctx, entity)
	}
	return entity, nil
}

func (m WebhookDeliveryDAOMock) Update(ctx context.Context, entity *WebhookDelivery) (*WebhookDelivery, error) {
	return entity, nil
}

func (m WebhookDeliveryDAOMock) Delete(ctx context.Context, id uint64) error { return nil }

func (m WebhookDeliveryDAOMock) HardDelete(ctx context.Context, id uint64) error { return nil }

func (m WebhookDeliveryDAOMock) Search(ctx context.Context, field string, value any) (*WebhookDelivery, error) {
	return nil, nil
}

func (m WebhookDeliveryDAOMock) DeliveredForEvent(ctx context.Context, eventID uint64) ([]*WebhookDelivery, error) {
	if m.DeliveredForEventFn != nil {
		return m.DeliveredForEventFn(ctx, eventID)
	}
	return nil, nil
}

func (m IdempotencyKeyDAOMock) ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[IdempotencyKey], error) {
	return m.List(ctx, q)
}

func (m IdempotencyKeyDAOMock) FindInOrg(ctx context.Context, id, organizationID uint64) (*IdempotencyKey, error) {
	return m.Find(ctx, id)
}

func (m IntegrationEventDAOMock) ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[IntegrationEvent], error) {
	return m.List(ctx, q)
}

func (m IntegrationEventDAOMock) FindInOrg(ctx context.Context, id, organizationID uint64) (*IntegrationEvent, error) {
	return m.Find(ctx, id)
}

func (m WebhookDeliveryDAOMock) ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[WebhookDelivery], error) {
	return m.List(ctx, q)
}

func (m WebhookDeliveryDAOMock) FindInOrg(ctx context.Context, id, organizationID uint64) (*WebhookDelivery, error) {
	return m.Find(ctx, id)
}

func (m WebhookSubscriptionDAOMock) ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[WebhookSubscription], error) {
	return m.List(ctx, q)
}

func (m WebhookSubscriptionDAOMock) FindInOrg(ctx context.Context, id, organizationID uint64) (*WebhookSubscription, error) {
	return m.Find(ctx, id)
}
