//go:build test

package localization

import (
	"context"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type ProfileDAOMock struct {
	dao.CRUDMock[Profile]
}

type TaxTemplateLineDAOMock struct {
	dao.CRUDMock[TaxTemplateLine]
	ListByProfileFunc     func(ctx context.Context, profileID uint64) ([]*TaxTemplateLine, error)
	ReplaceForProfileFunc func(ctx context.Context, profileID uint64, lines []*TaxTemplateLine) error
}

func (m TaxTemplateLineDAOMock) ListByProfile(ctx context.Context, profileID uint64) ([]*TaxTemplateLine, error) {
	if m.ListByProfileFunc != nil {
		return m.ListByProfileFunc(ctx, profileID)
	}
	return []*TaxTemplateLine{}, nil
}

func (m TaxTemplateLineDAOMock) ReplaceForProfile(ctx context.Context, profileID uint64, lines []*TaxTemplateLine) error {
	if m.ReplaceForProfileFunc != nil {
		return m.ReplaceForProfileFunc(ctx, profileID, lines)
	}
	return nil
}

type OrganizationUpdaterMock struct {
	ApplyLocalizationFunc func(ctx context.Context, organizationID uint64, countryCode, currencyCode, timezone string, taxYearStartMonth int16) error
}

func (m OrganizationUpdaterMock) ApplyLocalization(ctx context.Context, organizationID uint64, countryCode, currencyCode, timezone string, taxYearStartMonth int16) error {
	if m.ApplyLocalizationFunc != nil {
		return m.ApplyLocalizationFunc(ctx, organizationID, countryCode, currencyCode, timezone, taxYearStartMonth)
	}
	return nil
}
