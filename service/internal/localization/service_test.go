package localization

import (
	"context"
	"errors"
	"testing"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
)

func profileBaseFor(id uint64) model.Base {
	return model.Base{ID: id}
}

func profileMock(crud dao.CRUDMock[Profile]) ProfileDAOMock {
	return ProfileDAOMock{CRUDMock: crud}
}

func TestCreateProfile_ValidatesName(t *testing.T) {
	svc := NewProfileService(ProfileDAOMock{}, TaxTemplateLineDAOMock{}, OrganizationUpdaterMock{})
	if _, err := svc.CreateProfile(context.Background(), &Profile{CountryCode: "ID", CurrencyCode: "IDR", TaxYearStartMonth: 1}); !errors.Is(err, ErrProfileNameRequired) {
		t.Fatalf("err = %v, want ErrProfileNameRequired", err)
	}
}

func TestCreateProfile_ValidatesCountry(t *testing.T) {
	svc := NewProfileService(ProfileDAOMock{}, TaxTemplateLineDAOMock{}, OrganizationUpdaterMock{})
	if _, err := svc.CreateProfile(context.Background(), &Profile{Name: "Indonesia", CountryCode: "IND", CurrencyCode: "IDR", TaxYearStartMonth: 1}); !errors.Is(err, ErrProfileCountryInvalid) {
		t.Fatalf("err = %v, want ErrProfileCountryInvalid", err)
	}
}

func TestCreateProfile_ValidatesCurrency(t *testing.T) {
	svc := NewProfileService(ProfileDAOMock{}, TaxTemplateLineDAOMock{}, OrganizationUpdaterMock{})
	if _, err := svc.CreateProfile(context.Background(), &Profile{Name: "Indonesia", CountryCode: "ID", CurrencyCode: "RUPIAH", TaxYearStartMonth: 1}); !errors.Is(err, ErrProfileCurrencyInvalid) {
		t.Fatalf("err = %v, want ErrProfileCurrencyInvalid", err)
	}
}

func TestCreateProfile_ValidatesTaxYearMonth(t *testing.T) {
	svc := NewProfileService(ProfileDAOMock{}, TaxTemplateLineDAOMock{}, OrganizationUpdaterMock{})
	if _, err := svc.CreateProfile(context.Background(), &Profile{Name: "Indonesia", CountryCode: "ID", CurrencyCode: "IDR", TaxYearStartMonth: 13}); !errors.Is(err, ErrProfileTaxYearMonth) {
		t.Fatalf("err = %v, want ErrProfileTaxYearMonth", err)
	}
}

func TestCreateProfile_NormalizesAndDefaults(t *testing.T) {
	var created *Profile
	svc := NewProfileService(profileMock(dao.CRUDMock[Profile]{
		CreateFunc: func(_ context.Context, entity *Profile) (*Profile, error) {
			created = entity
			return entity, nil
		},
	}), TaxTemplateLineDAOMock{}, OrganizationUpdaterMock{})

	profile, err := svc.CreateProfile(context.Background(), &Profile{Name: " Indonesia ", CountryCode: "id", CurrencyCode: "idr", TaxYearStartMonth: 1})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if profile.CountryCode != "ID" || profile.CurrencyCode != "IDR" {
		t.Fatalf("codes not normalized: %+v", profile)
	}
	if created.Timezone != "UTC" {
		t.Fatalf("timezone = %q, want UTC", created.Timezone)
	}
}

func TestCreateProfile_DuplicateCountry(t *testing.T) {
	svc := NewProfileService(profileMock(dao.CRUDMock[Profile]{
		SearchFunc: func(_ context.Context, _ string, _ any) (*Profile, error) {
			return &Profile{Base: profileBaseFor(5), CountryCode: "ID"}, nil
		},
	}), TaxTemplateLineDAOMock{}, OrganizationUpdaterMock{})

	if _, err := svc.CreateProfile(context.Background(), &Profile{Name: "Indonesia", CountryCode: "ID", CurrencyCode: "IDR", TaxYearStartMonth: 1}); !errors.Is(err, ErrProfileCountryExists) {
		t.Fatalf("err = %v, want ErrProfileCountryExists", err)
	}
}

func TestUpdateProfile_NotFound(t *testing.T) {
	svc := NewProfileService(profileMock(dao.CRUDMock[Profile]{
		FindFunc: func(_ context.Context, _ uint64) (*Profile, error) { return nil, nil },
	}), TaxTemplateLineDAOMock{}, OrganizationUpdaterMock{})

	_, err := svc.UpdateProfile(context.Background(), &Profile{Base: profileBaseFor(9), Name: "Indonesia", CountryCode: "ID", CurrencyCode: "IDR", TaxYearStartMonth: 1})
	if !errors.Is(err, ErrProfileNotFound) {
		t.Fatalf("err = %v, want ErrProfileNotFound", err)
	}
}

func TestReplaceTaxTemplateLines_InvalidKind(t *testing.T) {
	svc := NewProfileService(profileMock(dao.CRUDMock[Profile]{
		FindFunc: func(_ context.Context, id uint64) (*Profile, error) { return &Profile{Base: profileBaseFor(id)}, nil },
	}), TaxTemplateLineDAOMock{}, OrganizationUpdaterMock{})

	_, err := svc.ReplaceTaxTemplateLines(context.Background(), 1, []*TaxTemplateLine{{Name: "VAT", Kind: "other"}})
	if !errors.Is(err, ErrTaxKindInvalid) {
		t.Fatalf("err = %v, want ErrTaxKindInvalid", err)
	}
}

func TestApplyProfile_Inactive(t *testing.T) {
	svc := NewProfileService(profileMock(dao.CRUDMock[Profile]{
		FindFunc: func(_ context.Context, id uint64) (*Profile, error) {
			return &Profile{Base: profileBaseFor(id), CountryCode: "ID", CurrencyCode: "IDR", Active: false}, nil
		},
	}), TaxTemplateLineDAOMock{}, OrganizationUpdaterMock{})

	if _, err := svc.ApplyProfile(context.Background(), 1, 2); !errors.Is(err, ErrProfileNotFound) {
		t.Fatalf("err = %v, want ErrProfileNotFound", err)
	}
}

func TestApplyProfile_Applies(t *testing.T) {
	var applied bool
	svc := NewProfileService(profileMock(dao.CRUDMock[Profile]{
		FindFunc: func(_ context.Context, id uint64) (*Profile, error) {
			return &Profile{Base: profileBaseFor(id), CountryCode: "ID", CurrencyCode: "IDR", Timezone: "Asia/Jakarta", TaxYearStartMonth: 1, Active: true}, nil
		},
	}), TaxTemplateLineDAOMock{}, OrganizationUpdaterMock{
		ApplyLocalizationFunc: func(_ context.Context, orgID uint64, countryCode, currencyCode, timezone string, month int16) error {
			applied = true
			if orgID != 1 || countryCode != "ID" || currencyCode != "IDR" || timezone != "Asia/Jakarta" || month != 1 {
				t.Fatalf("unexpected apply args: %d %s %s %s %d", orgID, countryCode, currencyCode, timezone, month)
			}
			return nil
		},
	})

	if _, err := svc.ApplyProfile(context.Background(), 1, 2); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !applied {
		t.Fatal("expected ApplyLocalization to be called")
	}
}

func TestApplyProfile_RequiresOrganization(t *testing.T) {
	svc := NewProfileService(ProfileDAOMock{}, TaxTemplateLineDAOMock{}, OrganizationUpdaterMock{})
	if _, err := svc.ApplyProfile(context.Background(), 0, 1); !errors.Is(err, ErrOrganizationNotFound) {
		t.Fatalf("err = %v, want ErrOrganizationNotFound", err)
	}
}
