package organization

import (
	"context"
	"errors"
	"testing"

	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type seederStub struct {
	err    error
	seeded []uint64
}

func (s *seederStub) SeedForOrganization(ctx context.Context, organizationID uint64) error {
	if s.err != nil {
		return s.err
	}
	s.seeded = append(s.seeded, organizationID)
	return nil
}

func quickCreateMocks(currency string, currencyErr error) (DAOMock, currencyDAOMock, memberProvisionerMock) {
	orgs := DAOMock{
		CRUDMock: dao.CRUDMock[reference.Organization]{
			CreateFunc: func(_ context.Context, org *reference.Organization) (*reference.Organization, error) {
				org.ID = 11
				return org, nil
			},
		},
	}
	currencies := currencyDAOMock{
		searchFunc: func(_ context.Context, _ string, value any) (*reference.Currency, error) {
			if currencyErr != nil {
				return nil, currencyErr
			}
			if value == currency {
				return &reference.Currency{Code: currency}, nil
			}
			return nil, nil
		},
	}
	return orgs, currencies, memberProvisionerMock{}
}

func TestOrganizationService_QuickCreate(t *testing.T) {
	ctx := context.Background()

	t.Run("creates with country defaults and provisions owner", func(t *testing.T) {
		orgs, currencies, members := quickCreateMocks("IDR", nil)
		svc := NewOrganizationService(orgs, currencies, countryDAOMock{}, members, nil)

		created, err := svc.QuickCreate(ctx, "Toko Maju", "ID", 5)
		if helper.AssertError(t, err, false, nil) {
			return
		}
		if created.BaseCurrency != "IDR" {
			t.Errorf("currency = %q, want IDR", created.BaseCurrency)
		}
		if created.Timezone != "Asia/Jakarta" {
			t.Errorf("timezone = %q, want Asia/Jakarta", created.Timezone)
		}
		if created.CountryCode == nil || *created.CountryCode != "ID" {
			t.Errorf("country code = %+v, want ID", created.CountryCode)
		}
		if created.TaxYearStartMonth != 1 {
			t.Errorf("fiscal start = %d, want 1", created.TaxYearStartMonth)
		}
	})

	t.Run("accepts lowercase country code", func(t *testing.T) {
		orgs, currencies, members := quickCreateMocks("IDR", nil)
		svc := NewOrganizationService(orgs, currencies, countryDAOMock{}, members, nil)

		created, err := svc.QuickCreate(ctx, "Toko Maju", "id", 5)
		if helper.AssertError(t, err, false, nil) {
			return
		}
		if created.BaseCurrency != "IDR" {
			t.Errorf("currency = %q, want IDR", created.BaseCurrency)
		}
	})

	t.Run("uses the selected currency and address", func(t *testing.T) {
		orgs := DAOMock{
			CRUDMock: dao.CRUDMock[reference.Organization]{
				CreateFunc: func(_ context.Context, org *reference.Organization) (*reference.Organization, error) {
					org.ID = 11
					return org, nil
				},
			},
		}
		currencies := currencyDAOMock{
			searchFunc: func(_ context.Context, _ string, value any) (*reference.Currency, error) {
				if value == "USD" {
					return &reference.Currency{Code: "USD"}, nil
				}
				return nil, nil
			},
		}
		svc := NewOrganizationService(orgs, currencies, countryDAOMock{}, memberProvisionerMock{}, nil)
		address := "Jl. Sudirman 1"
		city := "Jakarta"
		postalCode := "10220"

		created, err := svc.QuickCreate(ctx, "Toko Maju", "ID", 5, QuickCreateOptions{
			BaseCurrency: "usd",
			Address:      &address,
			City:         &city,
			PostalCode:   &postalCode,
		})
		if helper.AssertError(t, err, false, nil) {
			return
		}
		if created.BaseCurrency != "USD" {
			t.Errorf("currency = %q, want USD", created.BaseCurrency)
		}
		if created.Address == nil || *created.Address != address {
			t.Errorf("address = %+v, want %q", created.Address, address)
		}
		if created.City == nil || *created.City != city {
			t.Errorf("city = %+v, want %q", created.City, city)
		}
		if created.PostalCode == nil || *created.PostalCode != postalCode {
			t.Errorf("postal code = %+v, want %q", created.PostalCode, postalCode)
		}
	})

	t.Run("seeds base data when seeder configured", func(t *testing.T) {
		orgs, currencies, members := quickCreateMocks("USD", nil)
		seeder := &seederStub{}
		svc := NewOrganizationService(orgs, currencies, countryDAOMock{}, members, seeder)

		created, err := svc.QuickCreate(ctx, "Acme", "US", 5)
		if helper.AssertError(t, err, false, nil) {
			return
		}
		if len(seeder.seeded) != 1 || seeder.seeded[0] != created.ID {
			t.Errorf("seeded = %v, want [%d]", seeder.seeded, created.ID)
		}
	})

	anelorErr := errors.New("db down")
	failures := []struct {
		name        string
		setup       func() Service
		orgName     string
		countryCode string
		wantErr     error
	}{
		{
			name: "rejects empty name",
			setup: func() Service {
				o, c, m := quickCreateMocks("IDR", nil)
				return NewOrganizationService(o, c, countryDAOMock{}, m, nil)
			},
			orgName:     "  ",
			countryCode: "ID",
			wantErr:     ErrNameRequired,
		},
		{
			name: "rejects unknown country",
			setup: func() Service {
				o, c, m := quickCreateMocks("IDR", nil)
				return NewOrganizationService(o, c, countryDAOMock{}, m, nil)
			},
			orgName:     "Acme",
			countryCode: "XX",
			wantErr:     ErrCountryCodeInvalid,
		},
		{
			name: "rejects malformed country code",
			setup: func() Service {
				o, c, m := quickCreateMocks("IDR", nil)
				return NewOrganizationService(o, c, countryDAOMock{}, m, nil)
			},
			orgName:     "Acme",
			countryCode: "IDN",
			wantErr:     ErrCountryCodeInvalid,
		},
		{
			name: "rejects missing currency",
			setup: func() Service {
				o, c, m := quickCreateMocks("NOPE", nil)
				return NewOrganizationService(o, c, countryDAOMock{}, m, nil)
			},
			orgName:     "Acme",
			countryCode: "ID",
			wantErr:     ErrBaseCurrencyNotFound,
		},
		{
			name: "propagates currency lookup error",
			setup: func() Service {
				o, c, m := quickCreateMocks("IDR", anelorErr)
				return NewOrganizationService(o, c, countryDAOMock{}, m, nil)
			},
			orgName:     "Acme",
			countryCode: "ID",
			wantErr:     anelorErr,
		},
		{
			name: "propagates create error",
			setup: func() Service {
				orgs := DAOMock{
					CRUDMock: dao.CRUDMock[reference.Organization]{
						CreateFunc: func(_ context.Context, _ *reference.Organization) (*reference.Organization, error) {
							return nil, anelorErr
						},
					},
				}
				_, currencies, members := quickCreateMocks("IDR", nil)
				return NewOrganizationService(orgs, currencies, countryDAOMock{}, members, nil)
			},
			orgName:     "Acme",
			countryCode: "ID",
			wantErr:     anelorErr,
		},
		{
			name: "propagates owner provisioning error",
			setup: func() Service {
				orgs, currencies, _ := quickCreateMocks("IDR", nil)
				members := memberProvisionerMock{
					provisionOwnerFunc: func(_ context.Context, _, _ uint64) error { return anelorErr },
				}
				return NewOrganizationService(orgs, currencies, countryDAOMock{}, members, nil)
			},
			orgName:     "Acme",
			countryCode: "ID",
			wantErr:     anelorErr,
		},
		{
			name: "propagates seeder error",
			setup: func() Service {
				orgs, currencies, members := quickCreateMocks("IDR", nil)
				return NewOrganizationService(orgs, currencies, countryDAOMock{}, members, &seederStub{err: anelorErr})
			},
			orgName:     "Acme",
			countryCode: "ID",
			wantErr:     anelorErr,
		},
	}

	for _, tt := range failures {
		t.Run(tt.name, func(t *testing.T) {
			svc := tt.setup()
			_, err := svc.QuickCreate(ctx, tt.orgName, tt.countryCode, 5)
			helper.AssertError(t, err, true, tt.wantErr)
		})
	}
}

func TestOrganizationService_Create_WithSeeder(t *testing.T) {
	ctx := context.Background()

	t.Run("seeds base data on create", func(t *testing.T) {
		orgs, currencies, members := quickCreateMocks("IDR", nil)
		seeder := &seederStub{}
		svc := NewOrganizationService(orgs, currencies, countryDAOMock{}, members, seeder)

		created, err := svc.Create(ctx, &reference.Organization{Name: "Acme", BaseCurrency: "IDR"}, 5)
		if helper.AssertError(t, err, false, nil) {
			return
		}
		if len(seeder.seeded) != 1 || seeder.seeded[0] != created.ID {
			t.Errorf("seeded = %v, want [%d]", seeder.seeded, created.ID)
		}
	})

	t.Run("propagates seeder error on create", func(t *testing.T) {
		dbErr := errors.New("seed down")
		orgs, currencies, members := quickCreateMocks("IDR", nil)
		svc := NewOrganizationService(orgs, currencies, countryDAOMock{}, members, &seederStub{err: dbErr})

		_, err := svc.Create(ctx, &reference.Organization{Name: "Acme", BaseCurrency: "IDR"}, 5)
		helper.AssertError(t, err, true, dbErr)
	})

	t.Run("seeds base data through the configured seeder", func(t *testing.T) {
		orgs, currencies, members := quickCreateMocks("IDR", nil)
		seeder := &seederStub{}
		svc := NewOrganizationService(orgs, currencies, countryDAOMock{}, members, seeder)

		created, err := svc.Create(ctx, &reference.Organization{Name: "Acme", BaseCurrency: "IDR"}, 5)
		if helper.AssertError(t, err, false, nil) {
			return
		}
		if len(seeder.seeded) != 1 || seeder.seeded[0] != created.ID {
			t.Errorf("seeded = %v, want [%d]", seeder.seeded, created.ID)
		}
	})
}
