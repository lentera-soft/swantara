package localization

import (
	"context"
	"strings"

	"github.com/jalusw/swantara/apps/service/internal/kernel/query"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type ProfileService struct {
	profiles ProfileDAO
	lines    TaxTemplateLineDAO
	updater  OrganizationUpdater
}

func NewProfileService(profiles ProfileDAO, lines TaxTemplateLineDAO, updater OrganizationUpdater) ProfileService {
	return ProfileService{profiles: profiles, lines: lines, updater: updater}
}

func (s ProfileService) ListProfiles(ctx context.Context, q *query.Query) (*query.Page[Profile], error) {
	return s.profiles.List(ctx, q)
}

func (s ProfileService) FindProfile(ctx context.Context, id uint64) (*Profile, error) {
	return s.profiles.Find(ctx, id)
}

func (s ProfileService) CreateProfile(ctx context.Context, profile *Profile) (*Profile, error) {
	if err := s.validateProfile(ctx, profile, 0); err != nil {
		return nil, err
	}
	return s.profiles.Create(ctx, profile)
}

func (s ProfileService) UpdateProfile(ctx context.Context, profile *Profile) (*Profile, error) {
	if err := s.validateProfile(ctx, profile, profile.ID); err != nil {
		return nil, err
	}
	existing, err := s.profiles.Find(ctx, profile.ID)
	if err != nil {
		return nil, dao.NotFound(err, ErrProfileNotFound)
	}
	if existing == nil {
		return nil, ErrProfileNotFound
	}
	return s.profiles.Update(ctx, profile)
}

func (s ProfileService) DeleteProfile(ctx context.Context, id uint64) error {
	existing, err := s.profiles.Find(ctx, id)
	if err != nil {
		return dao.NotFound(err, ErrProfileNotFound)
	}
	if existing == nil {
		return ErrProfileNotFound
	}
	return s.profiles.Delete(ctx, id)
}

func (s ProfileService) ListTaxTemplateLines(ctx context.Context, profileID uint64) ([]*TaxTemplateLine, error) {
	profile, err := s.profiles.Find(ctx, profileID)
	if err != nil {
		return nil, dao.NotFound(err, ErrProfileNotFound)
	}
	if profile == nil {
		return nil, ErrProfileNotFound
	}
	return s.lines.ListByProfile(ctx, profileID)
}

func (s ProfileService) ReplaceTaxTemplateLines(ctx context.Context, profileID uint64, lines []*TaxTemplateLine) ([]*TaxTemplateLine, error) {
	profile, err := s.profiles.Find(ctx, profileID)
	if err != nil {
		return nil, dao.NotFound(err, ErrProfileNotFound)
	}
	if profile == nil {
		return nil, ErrProfileNotFound
	}
	for _, line := range lines {
		if err := validateTaxTemplateLine(line); err != nil {
			return nil, err
		}
	}
	if err := s.lines.ReplaceForProfile(ctx, profileID, lines); err != nil {
		return nil, err
	}
	return s.lines.ListByProfile(ctx, profileID)
}

func (s ProfileService) ApplyProfile(ctx context.Context, organizationID, profileID uint64) (*Profile, error) {
	if organizationID == 0 {
		return nil, ErrOrganizationNotFound
	}
	profile, err := s.profiles.Find(ctx, profileID)
	if err != nil {
		return nil, dao.NotFound(err, ErrProfileNotFound)
	}
	if profile == nil {
		return nil, ErrProfileNotFound
	}
	if !profile.Active {
		return nil, ErrProfileNotFound
	}
	if err := s.updater.ApplyLocalization(ctx, organizationID, profile.CountryCode, profile.CurrencyCode, profile.Timezone, profile.TaxYearStartMonth); err != nil {
		return nil, err
	}
	return profile, nil
}

func (s ProfileService) validateProfile(ctx context.Context, profile *Profile, excludeID uint64) error {
	profile.Name = strings.TrimSpace(profile.Name)
	if profile.Name == "" {
		return ErrProfileNameRequired
	}
	profile.CountryCode = strings.ToUpper(strings.TrimSpace(profile.CountryCode))
	if !isAlphaCode(profile.CountryCode, 2) {
		return ErrProfileCountryInvalid
	}
	profile.CurrencyCode = strings.ToUpper(strings.TrimSpace(profile.CurrencyCode))
	if !isAlphaCode(profile.CurrencyCode, 3) {
		return ErrProfileCurrencyInvalid
	}
	if profile.TaxYearStartMonth < 1 || profile.TaxYearStartMonth > 12 {
		return ErrProfileTaxYearMonth
	}
	if profile.Timezone == "" {
		profile.Timezone = "UTC"
	}

	existing, err := s.profiles.Search(ctx, "country_code", profile.CountryCode)
	if err != nil {
		return err
	}
	if existing != nil && existing.ID != excludeID {
		return ErrProfileCountryExists
	}
	return nil
}

func validateTaxTemplateLine(line *TaxTemplateLine) error {
	line.Name = strings.TrimSpace(line.Name)
	if line.Name == "" {
		return ErrTaxTemplateLineName
	}
	if line.Kind != TaxKindSale && line.Kind != TaxKindPurchase {
		return ErrTaxKindInvalid
	}
	if line.Rate < 0 {
		return ErrTaxTemplateRateInvalid
	}
	return nil
}

func isAlphaCode(value string, length int) bool {
	if len(value) != length {
		return false
	}
	for _, r := range value {
		if r < 'A' || r > 'Z' {
			return false
		}
	}
	return true
}
