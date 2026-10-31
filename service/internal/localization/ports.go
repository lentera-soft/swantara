package localization

import "context"

type OrganizationUpdater interface {
	ApplyLocalization(ctx context.Context, organizationID uint64, countryCode, currencyCode, timezone string, taxYearStartMonth int16) error
}
