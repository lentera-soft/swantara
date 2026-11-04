package organization

import (
	"context"
	"strings"

	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/queue"
	"github.com/jalusw/swantara/apps/service/internal/queue/tasks"
	"github.com/jalusw/swantara/apps/service/internal/reference"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type Service struct {
	organizations OrganizationDAO
	currencies    CurrencyDAO
	countries     CountryDAO
	members       MemberProvisioner
	seeder        Seeder
	enqueuer      queue.TaskEnqueuer
}

func NewOrganizationService(
	organizations OrganizationDAO,
	currencies CurrencyDAO,
	countries CountryDAO,
	members MemberProvisioner,
	seeder Seeder,
) Service {
	return Service{
		organizations: organizations,
		currencies:    currencies,
		countries:     countries,
		members:       members,
		seeder:        seeder,
	}
}

func (s Service) WithProvisionEnqueuer(enqueuer queue.TaskEnqueuer) Service {
	s.enqueuer = enqueuer
	return s
}

func (s Service) QuickCreate(ctx context.Context, name string, countryCode string, ownerUserID uint64) (*reference.Organization, error) {

	if strings.TrimSpace(name) == "" {
		return nil, ErrNameRequired
	}

	code := strings.ToUpper(strings.TrimSpace(countryCode))

	if len(code) != 2 {
		return nil, ErrCountryCodeInvalid
	}

	country, err := s.countries.Search(ctx, "code", code)
	if err != nil {
		return nil, err
	}
	if country == nil {
		return nil, ErrCountryCodeInvalid
	}

	if err := s.validateBaseCurrency(ctx, country.CurrencyCode); err != nil {
		return nil, err
	}

	cc := country.Code
	org := &reference.Organization{
		Name:              name,
		BaseCurrency:      country.CurrencyCode,
		CountryCode:       &cc,
		Timezone:          country.Timezone,
		TaxYearStartMonth: 1,
	}

	created, err := s.organizations.Create(ctx, org)
	if err != nil {
		return nil, err
	}
	if err := s.members.ProvisionOwner(ctx, created.ID, ownerUserID); err != nil {
		return nil, err
	}
	if err := s.provision(ctx, created.ID); err != nil {
		return nil, err
	}
	return created, nil
}

// provision seeds the organization's base data. It is delegated to the queue
// when one is configured so the request is not held up by seeding, and falls
// back to synchronous provisioning otherwise.
func (s Service) provision(ctx context.Context, organizationID uint64) error {
	if s.enqueuer == nil {
		return s.Provision(ctx, organizationID)
	}
	task, err := tasks.NewOrganizationProvisioningTask(organizationID, helper.RequestID(ctx))
	if err != nil {
		return err
	}
	_, err = s.enqueuer.Enqueue(task)
	return err
}

// Provision seeds the base data of an organization that already exists. It is
// called by the provisioning task (or synchronously when no queue is wired).
func (s Service) Provision(ctx context.Context, organizationID uint64) error {
	if s.seeder != nil {
		if err := s.seeder.SeedForOrganization(ctx, organizationID); err != nil {
			return err
		}
	}
	return nil
}

func (s Service) Create(ctx context.Context, org *reference.Organization, ownerUserID uint64) (*reference.Organization, error) {
	if strings.TrimSpace(org.Name) == "" {
		return nil, ErrNameRequired
	}
	if err := s.validateBaseCurrency(ctx, org.BaseCurrency); err != nil {
		return nil, err
	}
	if err := s.validateParent(ctx, 0, org.ParentID); err != nil {
		return nil, err
	}

	if org.Timezone == "" {
		org.Timezone = "UTC"
	}
	if org.TaxYearStartMonth == 0 {
		org.TaxYearStartMonth = 1
	}

	created, err := s.organizations.Create(ctx, org)
	if err != nil {
		return nil, err
	}
	if err := s.members.ProvisionOwner(ctx, created.ID, ownerUserID); err != nil {
		return nil, err
	}
	if err := s.provision(ctx, created.ID); err != nil {
		return nil, err
	}
	return created, nil
}

func (s Service) Update(ctx context.Context, orgID uint64, org *reference.Organization) (*reference.Organization, error) {
	existing, err := s.organizations.Find(ctx, orgID)

	if err != nil {
		return nil, dao.NotFound(err, ErrOrganizationNotFound)
	}

	if existing == nil {
		return nil, ErrOrganizationNotFound
	}

	if strings.TrimSpace(org.Name) == "" {
		return nil, ErrNameRequired
	}

	if err := s.validateParent(ctx, orgID, org.ParentID); err != nil {
		return nil, err
	}

	if org.BaseCurrency != "" {
		if err := s.validateBaseCurrency(ctx, org.BaseCurrency); err != nil {
			return nil, err
		}
		existing.BaseCurrency = org.BaseCurrency
	}

	existing.Name = org.Name
	existing.LegalName = org.LegalName
	existing.ParentID = org.ParentID
	existing.CountryCode = org.CountryCode
	existing.TaxID = org.TaxID
	existing.Address = org.Address
	existing.City = org.City
	existing.PostalCode = org.PostalCode
	if org.Timezone != "" {
		existing.Timezone = org.Timezone
	}
	if org.TaxYearStartMonth != 0 {
		existing.TaxYearStartMonth = org.TaxYearStartMonth
	}

	return s.organizations.Update(ctx, existing)
}

func (s Service) validateBaseCurrency(ctx context.Context, code string) error {
	currency, err := s.currencies.Search(ctx, "code", code)
	if err != nil {
		return dao.NotFound(err, ErrBaseCurrencyNotFound)
	}
	if currency == nil {
		return ErrBaseCurrencyNotFound
	}
	return nil
}

func (s Service) validateParent(ctx context.Context, orgID uint64, parentID *uint64) error {
	if parentID == nil {
		return nil
	}
	if *parentID == orgID {
		return ErrParentCycle
	}

	parent, err := s.organizations.Find(ctx, *parentID)
	if err != nil {
		return dao.NotFound(err, ErrParentNotFound)
	}
	if parent == nil {
		return ErrParentNotFound
	}

	current := parent
	for current.ParentID != nil {
		if *current.ParentID == orgID {
			return ErrParentCycle
		}
		next, err := s.organizations.Find(ctx, *current.ParentID)
		if err != nil {
			return dao.NotFound(err, ErrParentNotFound)
		}
		if next == nil {
			return ErrParentNotFound
		}
		current = next
	}
	return nil
}
