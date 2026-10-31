//go:build test

package dao

import (
	"context"
	"reflect"

	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/kernel/scope"
)

type CRUDMock[E any] struct {
	ListFunc       func(ctx context.Context, q *query.Query) (*query.Page[E], error)
	ListInOrgFunc  func(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[E], error)
	SearchFunc     func(ctx context.Context, field string, value any) (*E, error)
	FindFunc       func(ctx context.Context, id uint64) (*E, error)
	FindInOrgFunc  func(ctx context.Context, id, organizationID uint64) (*E, error)
	CreateFunc     func(ctx context.Context, entity *E) (*E, error)
	UpdateFunc     func(ctx context.Context, entity *E) (*E, error)
	DeleteFunc     func(ctx context.Context, id uint64) error
	HardDeleteFunc func(ctx context.Context, id uint64) error
}

func (m CRUDMock[E]) List(ctx context.Context, q *query.Query) (*query.Page[E], error) {
	if m.ListFunc != nil {
		return m.ListFunc(ctx, q)
	}
	return &query.Page[E]{Items: []*E{}, Count: 0}, nil
}

func (m CRUDMock[E]) ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[E], error) {
	if m.ListInOrgFunc != nil {
		return m.ListInOrgFunc(ctx, q, organizationID)
	}
	return m.List(ctx, scope.ToOrg(q, organizationID))
}

func (m CRUDMock[E]) Search(ctx context.Context, field string, value any) (*E, error) {
	if m.SearchFunc != nil {
		return m.SearchFunc(ctx, field, value)
	}
	return nil, nil
}

func (m CRUDMock[E]) Find(ctx context.Context, id uint64) (*E, error) {
	if m.FindFunc != nil {
		return m.FindFunc(ctx, id)
	}
	return nil, nil
}

func (m CRUDMock[E]) FindInOrg(ctx context.Context, id, organizationID uint64) (*E, error) {
	if m.FindInOrgFunc != nil {
		return m.FindInOrgFunc(ctx, id, organizationID)
	}
	entity, err := m.Find(ctx, id)
	if err != nil || entity == nil || mockOwns(entity, organizationID) {
		return entity, err
	}
	return nil, nil
}

// mockOwns reports whether a mocked entity belongs to organizationID, mirroring
// the SQL predicate used by Base.FindInOrg where a NULL or mismatched
// organization_id never matches. Entities without an organization_id field are
// treated as owned so tests exercising non-tenant DAOs keep working.
func mockOwns(entity any, organizationID uint64) bool {
	v := reflect.ValueOf(entity)
	if v.Kind() == reflect.Ptr {
		if v.IsNil() {
			return true
		}
		v = v.Elem()
	}
	if v.Kind() != reflect.Struct {
		return true
	}
	field := v.FieldByName("OrganizationID")
	if !field.IsValid() {
		return true
	}
	switch field.Kind() {
	case reflect.Ptr:
		if field.IsNil() {
			return false
		}
		return field.Elem().Uint() == organizationID
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		return field.Uint() == organizationID
	default:
		return true
	}
}

func (m CRUDMock[E]) Create(ctx context.Context, entity *E) (*E, error) {
	if m.CreateFunc != nil {
		return m.CreateFunc(ctx, entity)
	}
	return entity, nil
}

func (m CRUDMock[E]) Update(ctx context.Context, entity *E) (*E, error) {
	if m.UpdateFunc != nil {
		return m.UpdateFunc(ctx, entity)
	}
	return entity, nil
}

func (m CRUDMock[E]) Delete(ctx context.Context, id uint64) error {
	if m.DeleteFunc != nil {
		return m.DeleteFunc(ctx, id)
	}
	return nil
}

func (m CRUDMock[E]) HardDelete(ctx context.Context, id uint64) error {
	if m.HardDeleteFunc != nil {
		return m.HardDeleteFunc(ctx, id)
	}
	return nil
}
