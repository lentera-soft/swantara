//go:build test

package handler

import (
	"context"

	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type handlerCurrencySearchMock struct {
	search func(ctx context.Context, field string, value any) (*reference.Currency, error)
}

func (m handlerCurrencySearchMock) Search(ctx context.Context, field string, value any) (*reference.Currency, error) {
	if m.search != nil {
		return m.search(ctx, field, value)
	}
	return nil, nil
}

type handlerCountrySearchMock struct {
	search func(ctx context.Context, field string, value any) (*reference.Country, error)
}

func (m handlerCountrySearchMock) Search(ctx context.Context, field string, value any) (*reference.Country, error) {
	if m.search != nil {
		return m.search(ctx, field, value)
	}
	countries := map[string]reference.Country{
		"ID": {Code: "ID", CurrencyCode: "IDR", Timezone: "Asia/Jakarta"},
		"US": {Code: "US", CurrencyCode: "USD", Timezone: "America/New_York"},
	}
	code, _ := value.(string)
	country, ok := countries[code]
	if !ok {
		return nil, nil
	}
	return &country, nil
}

type handlerMemberProvisionerMock struct {
	provision func(ctx context.Context, organizationID, ownerUserID uint64) error
}

func (m handlerMemberProvisionerMock) ProvisionOwner(ctx context.Context, organizationID, ownerUserID uint64) error {
	if m.provision != nil {
		return m.provision(ctx, organizationID, ownerUserID)
	}
	return nil
}
