package dao

import (
	"context"
	"errors"
	"reflect"

	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/kernel/scope"
	"gorm.io/gorm"
)

// ErrNotFound is the sentinel error returned whenever a requested record does not
// exist in the database.
//
// It is the single, package-level value that the rest of the codebase compares
// against (via errors.Is) so callers can distinguish "missing row" from genuine
// database/IO failures. Repository methods translate GORM's gorm.ErrRecordNotFound
// into this sentinel before returning, keeping GORM details out of domain code.
//
// Example:
//
//	user, err := repo.Find(ctx, 42)
//	if errors.Is(err, dao.ErrNotFound) {
//	    // handle missing user
//	}
var ErrNotFound = errors.New("record not found")

// NotFound translates a missing-record error into a domain-specific not-found
// error while passing every other error through unchanged.
//
// This is useful at service boundaries: a repository returns dao.ErrNotFound, and
// the service maps it to its own sentinel (e.g. ErrUserNotFound) so handlers can
// render the correct HTTP status. Non-not-found errors (connection failures,
// constraint violations, ...) are returned verbatim so they are not masked.
//
// Example:
//
//	err := repo.Find(ctx, id)
//	return dao.NotFound(err, ErrUserNotFound)
func NotFound(err, notFound error) error {
	if errors.Is(err, ErrNotFound) {
		return notFound
	}
	return err
}

// IsNotFound reports whether err represents a missing record.
//
// It is a convenience wrapper over errors.Is(err, ErrNotFound) and is safe to
// call with a nil error (returns false). Prefer it over string matching or
// direct equality checks, which break when errors are wrapped.
//
// Example:
//
//	if dao.IsNotFound(err) {
//	    w.WriteHeader(http.StatusNotFound)
//	}
func IsNotFound(err error) bool {
	return errors.Is(err, ErrNotFound)
}

// CRUD is the standard repository contract shared by every entity in the system.
//
// It describes the minimal set of operations a store must expose: listing (with
// filtering, sorting and pagination), single-record lookup by id or by an
// arbitrary field, creation, update, and deletion. Concrete repositories embed
// Base[E] to inherit a working implementation and override methods only when
// entity-specific behaviour is required.
//
// All methods accept a context.Context as their first argument so callers can
// propagate deadlines, cancellation and (via WithTx) transactional scope.
type CRUD[E any] interface {
	List(ctx context.Context, query *query.Query) (*query.Page[E], error)
	ListInOrg(ctx context.Context, query *query.Query, organizationID uint64) (*query.Page[E], error)
	Search(ctx context.Context, field string, value any) (*E, error)
	Find(ctx context.Context, id uint64) (*E, error)
	FindInOrg(ctx context.Context, id, organizationID uint64) (*E, error)
	Create(ctx context.Context, entity *E) (*E, error)
	Update(ctx context.Context, entity *E) (*E, error)
	Delete(ctx context.Context, id uint64) error
	HardDelete(ctx context.Context, id uint64) error
}

// Base is a generic, GORM-backed repository that implements CRUD[E] for any
// entity type E.
//
// It holds a single *gorm.DB connection/transaction handle. Because Base is a
// value type, derived repositories (e.g. bound to a transaction via WithTx) are
// cheap to create and do not share mutable state. Entity types are expected to
// follow the conventions used by the helpers here: an "ID" field (uint) primary
// key and an optional "OrganizationID" field (uint) for multi-tenant scoping.
//
// Example:
//
//	type User struct {
//	    ID             uint64
//	    OrganizationID uint64
//	    Name           string
//	}
//	repo := dao.NewBase[User](db)
type Base[E any] struct {
	db *gorm.DB
}

// WithTx returns a copy of the repository whose underlying handle is the given
// transaction.
//
// Reads and writes performed through the returned repository participate in tx,
// so a service can compose multiple repository calls inside one transaction:
//
//	tx := db.Begin()
//	defer tx.Rollback()
//	userRepo := repo.WithTx(tx)
//	if _, err := userRepo.Create(ctx, u); err != nil { return err }
//	if err := auditRepo.WithTx(tx).Create(ctx, a); err != nil { return err }
//	return tx.Commit().Error
func (r Base[E]) WithTx(tx *gorm.DB) Base[E] {
	return Base[E]{db: tx}
}

// NewBase constructs a Base repository bound to db.
//
// db may be either a *gorm.DB connection or a transaction handle; in the latter
// case the repository behaves exactly as if created via WithTx.
//
// Example:
//
//	repo := dao.NewBase[User](db)
//	users, err := repo.List(ctx, q)
func NewBase[E any](db *gorm.DB) Base[E] {
	return Base[E]{db: db}
}

// List returns a paginated page of entities.
//
// Behaviour:
//   - A count query is run first, applying only q.Filters (so the total reflects
//     the filtered set, not pagination).
//   - A data query then applies the full query (filters, sorting, offset/limit)
//     and materialises the rows.
//   - Results are returned as []*E pointing into the loaded slice.
//   - When q is nil, no filtering/sorting/pagination is applied and all rows
//     are returned.
//
// The returned *query.Page[E] carries Items and the total Count.
//
// Example:
//
//	page, err := repo.List(ctx, &query.Query{
//	    Filters: []query.Filter{{Field: "status", Operator: query.Equal, Value: "active"}},
//	    Limit:   20,
//	    Offset:  0,
//	})
func (r Base[E]) List(ctx context.Context, q *query.Query) (*query.Page[E], error) {
	var count int64
	var entities []E

	countTx := r.db.WithContext(ctx).Model(&entities)
	if q != nil {
		countTx = query.ApplyFilters(countTx, q.Filters)
	}
	if err := countTx.Count(&count).Error; err != nil {
		return nil, err
	}

	tx := r.db.WithContext(ctx).Model(&entities)
	if q != nil {
		tx = query.ApplyQuery(tx, q)
	}
	if err := tx.Find(&entities).Error; err != nil {
		return nil, err
	}

	items := make([]*E, len(entities))
	for i := range entities {
		items[i] = &entities[i]
	}

	return &query.Page[E]{Items: items, Count: count}, nil
}

// ListInOrg is List scoped to a single organization.
//
// It delegates to List after rewriting q's filters to include
// organization_id = organizationID via scope.ToOrg, enforcing multi-tenant
// isolation without callers having to remember the filter.
//
// Example:
//
//	page, err := repo.ListInOrg(ctx, q, orgID)
func (r Base[E]) ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[E], error) {
	return r.List(ctx, scope.ToOrg(q, organizationID))
}

// FindInOrg returns the entity with the given id that belongs to organizationID.
//
// Returns ErrNotFound when no row matches both id and organization_id, which
// prevents cross-tenant access by id. Other database errors are returned
// verbatim.
//
// Example:
//
//	u, err := repo.FindInOrg(ctx, userID, orgID)
func (r Base[E]) FindInOrg(ctx context.Context, id, organizationID uint64) (*E, error) {
	var entity E
	err := r.db.WithContext(ctx).Where("id = ? AND organization_id = ?", id, organizationID).First(&entity).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &entity, nil
}

// Search returns the first entity where field equals value.
//
// Unlike Find, a missing record is reported as (nil, nil) rather than an error,
// making it convenient for "find or create" flows and optional lookups. Any other
// database error is returned. The match is performed through query.ApplyFilters
// with an Equal operator.
//
// Example:
//
//	u, err := repo.Search(ctx, "email", "a@b.com")
//	if err != nil { return err }
//	if u == nil { /* not present */ }
func (r Base[E]) Search(ctx context.Context, field string, value any) (*E, error) {
	var entity E
	tx := query.ApplyFilters(r.db.WithContext(ctx).Model(&entity), []query.Filter{
		{Field: field, Operator: query.Equal, Value: value},
	})
	if err := tx.Take(&entity).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &entity, nil
}

// SearchInOrg returns the first entity matching field/value within organizationID.
//
// Like Search, a missing record yields (nil, nil). The organization filter is
// applied in addition to the field equality, so results never leak across
// tenants.
//
// Example:
//
//	u, err := repo.SearchInOrg(ctx, orgID, "email", "a@b.com")
func (r Base[E]) SearchInOrg(ctx context.Context, organizationID uint64, field string, value any) (*E, error) {
	var entity E
	tx := query.ApplyFilters(r.db.WithContext(ctx).Model(&entity), []query.Filter{
		{Field: field, Operator: query.Equal, Value: value},
	})
	if err := tx.Where("organization_id = ?", organizationID).Take(&entity).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &entity, nil
}

// Find returns the entity with the given primary-key id.
//
// Returns ErrNotFound when no row has that id; other errors are returned as-is.
// Use FindInOrg when the entity is tenant-scoped.
//
// Example:
//
//	u, err := repo.Find(ctx, 42)
//	if dao.IsNotFound(err) { /* 404 */ }
func (r Base[E]) Find(ctx context.Context, id uint64) (*E, error) {
	var entity E
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&entity).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &entity, nil
}

// Create inserts a new entity and returns it (with any DB-generated fields such
// as the primary key populated on the input pointer).
//
// The entity pointer is mutated in place by GORM; the returned value is the same
// pointer for convenience.
//
// Example:
//
//	u := &User{Name: "Ada"}
//	created, err := repo.Create(ctx, u)
func (r Base[E]) Create(ctx context.Context, entity *E) (*E, error) {
	if err := r.db.WithContext(ctx).Create(entity).Error; err != nil {
		return nil, err
	}
	return entity, nil
}

// Update persists changes to an existing entity.
//
// Behaviour:
//   - The entity's ID is read reflectively (see entityScope). If ID is zero,
//     the call is treated as an insert and delegated to Create.
//   - When the entity has a non-zero OrganizationID, the UPDATE is additionally
//     constrained by organization_id, preventing cross-tenant writes.
//   - Select("*") ensures zero values are written (GORM would otherwise skip
//     them), so callers can clear fields by setting them to zero.
//   - Returns ErrNotFound when RowsAffected == 0 (no matching row).
//
// Example:
//
//	u.Name = "Grace"
//	updated, err := repo.Update(ctx, u)
func (r Base[E]) Update(ctx context.Context, entity *E) (*E, error) {
	id, organizationID, scoped := entityScope(entity)
	if id == 0 {
		return r.Create(ctx, entity)
	}
	tx := r.db.WithContext(ctx).Model(entity).Select("*")
	if scoped {
		tx = tx.Where("organization_id = ?", organizationID)
	}
	result := tx.Updates(entity)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, ErrNotFound
	}
	return entity, nil
}

// entityScope reflectively reads an entity's ID and OrganizationID fields.
//
// It dereferences pointers, returns (0, 0, false) for nil pointers or
// non-struct values, and reports scoped=true only when OrganizationID != 0.
// This keeps Update/tenant-scoping working for arbitrary entity types without
// requiring a common interface.
func entityScope(entity any) (id uint64, organizationID uint64, scoped bool) {
	value := reflect.ValueOf(entity)
	for value.Kind() == reflect.Pointer {
		if value.IsNil() {
			return 0, 0, false
		}
		value = value.Elem()
	}
	if value.Kind() != reflect.Struct {
		return 0, 0, false
	}
	id = uintField(value, "ID")
	organizationID = uintField(value, "OrganizationID")
	return id, organizationID, organizationID != 0
}

// uintField reads a uint value from a struct field named name.
//
// It supports both value and pointer-typed fields (dereferencing a non-nil
// pointer) and accepts all unsigned integer kinds. Returns 0 when the field is
// missing or of an unsupported type, which is why callers treat 0 as "unset".
func uintField(value reflect.Value, name string) uint64 {
	field := value.FieldByName(name)
	if !field.IsValid() {
		return 0
	}
	switch field.Kind() {
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		return field.Uint()
	case reflect.Pointer:
		if field.IsNil() {
			return 0
		}
		element := field.Elem()
		switch element.Kind() {
		case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
			return element.Uint()
		default:
			return 0
		}
	default:
		return 0
	}
}

// Delete soft-deletes the entity with the given id (sets deleted_at when the
// entity has gorm.DeletedAt; otherwise behaves like a normal delete).
//
// The row is not physically removed, so it can be restored or hard-deleted
// later. Returns any database error.
//
// Example:
//
//	err := repo.Delete(ctx, 42)
func (r Base[E]) Delete(ctx context.Context, id uint64) error {
	var entity E
	return r.db.WithContext(ctx).Delete(&entity, id).Error
}

// HardDelete permanently removes the entity with the given id, bypassing soft
// delete (Unscoped). Use with care: the row cannot be recovered.
//
// Example:
//
//	err := repo.HardDelete(ctx, 42)
func (r Base[E]) HardDelete(ctx context.Context, id uint64) error {
	var entity E
	return r.db.WithContext(ctx).Unscoped().Delete(&entity, id).Error
}
