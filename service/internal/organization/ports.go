package organization

import (
	"context"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type OrganizationDAO interface {
	dao.CRUD[reference.Organization]
}

type CurrencyDAO interface {
	Search(ctx context.Context, field string, value any) (*reference.Currency, error)
}

type CountryDAO interface {
	Search(ctx context.Context, field string, value any) (*reference.Country, error)
}

type MemberProvisioner interface {
	ProvisionOwner(ctx context.Context, organizationID, ownerUserID uint64) error
}

// Seeder provisions the baseline data a new organization starts with:
// currencies, chart of accounts, payment terms, journals, catalog, HR and
// every other reference record the foundation seeder owns.
type Seeder interface {
	SeedForOrganization(ctx context.Context, organizationID uint64) error
}
