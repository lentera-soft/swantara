package inquiry

import (
	"context"
	"regexp"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
)

func TestContactInquiryDAOListInOrgIsTenantScoped(t *testing.T) {
	db, mock := query.NewMockDB(t)

	mock.ExpectQuery(regexp.QuoteMeta(`SELECT count(*) FROM "contact_inquiries" WHERE organization_id = $1`)).
		WithArgs(uint64(10)).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "contact_inquiries" WHERE organization_id = $1`)).
		WithArgs(uint64(10)).
		WillReturnRows(sqlmock.NewRows([]string{"id", "organization_id", "name", "email", "status"}))

	page, err := NewContactInquiryDAO(db).ListInOrg(context.Background(), nil, 10)
	if err != nil {
		t.Fatalf("ListInOrg() error = %v", err)
	}
	if page.Count != 0 || len(page.Items) != 0 {
		t.Fatalf("page = %+v, want empty", page)
	}
	query.AssertDBMockDone(t, mock)
}

func TestContactInquiryDAOFindInOrgRejectsUnassignedInquiry(t *testing.T) {
	db, mock := query.NewMockDB(t)

	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "contact_inquiries" WHERE id = $1 AND organization_id = $2 ORDER BY "contact_inquiries"."id" LIMIT $3`)).
		WithArgs(uint64(5), uint64(10), 1).
		WillReturnRows(sqlmock.NewRows([]string{"id", "organization_id", "name", "email", "status"}))

	entity, err := NewContactInquiryDAO(db).FindInOrg(context.Background(), 5, 10)
	if err != nil {
		t.Fatalf("FindInOrg() error = %v", err)
	}
	if entity != nil {
		t.Fatalf("FindInOrg() = %+v, want nil", entity)
	}
	query.AssertDBMockDone(t, mock)
}
