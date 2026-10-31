// Package scope centralizes tenant (organization) scoping helpers used by
// domain services and DAOs to enforce multi-tenant isolation in the data
// access layer instead of in HTTP handlers.
package scope

import "github.com/jalusw/swantara/apps/service/internal/kernel/query"

// ToOrg appends an organization_id equality filter to a list query so results
// are scoped to a single tenant. A nil query is created.
func ToOrg(q *query.Query, organizationID uint64) *query.Query {
	if q == nil {
		q = &query.Query{}
	}
	q.Filters = append(q.Filters, query.Filter{
		Field:    "organization_id",
		Operator: query.Equal,
		Value:    organizationID,
	})
	return q
}

// Owns reports whether a pointer organization id belongs to the tenant.
func Owns(entityOrg *uint64, organizationID uint64) bool {
	return entityOrg != nil && *entityOrg == organizationID
}

// OwnsValue reports whether a value organization id belongs to the tenant.
func OwnsValue(entityOrg, organizationID uint64) bool {
	return entityOrg == organizationID
}
