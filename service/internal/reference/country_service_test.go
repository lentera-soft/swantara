package reference

import (
	"context"
	"errors"
	"regexp"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
)

func TestCountryService_ListCountries(t *testing.T) {
	db, mock := query.NewMockDB(t)
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT count(*) FROM "countries"`)).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "countries"`)).
		WillReturnRows(sqlmock.NewRows([]string{"id", "code", "name", "currency_code", "timezone"}).
			AddRow(1, "ID", "Indonesia", "IDR", "Asia/Jakarta"))

	svc := NewCountryService(dao.NewBase[Country](db))
	page, err := svc.ListCountries(context.Background(), &query.Query{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(page.Items) != 1 || page.Items[0].Code != "ID" {
		t.Fatalf("items = %+v, want one country with code ID", page.Items)
	}

	query.AssertDBMockDone(t, mock)
}

func TestCountryService_SearchCountry(t *testing.T) {
	db, mock := query.NewMockDB(t)
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "countries" WHERE code = $1 LIMIT $2`)).
		WithArgs("ID", 1).
		WillReturnRows(sqlmock.NewRows([]string{"id", "code", "name", "currency_code", "timezone"}).
			AddRow(1, "ID", "Indonesia", "IDR", "Asia/Jakarta"))

	svc := NewCountryService(dao.NewBase[Country](db))
	country, err := svc.SearchCountry(context.Background(), "code", "ID")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if country == nil || country.Name != "Indonesia" {
		t.Fatalf("country = %+v, want Indonesia", country)
	}

	query.AssertDBMockDone(t, mock)
}

func TestCountryService_FindCountry(t *testing.T) {
	db, mock := query.NewMockDB(t)
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "countries" WHERE id = $1 ORDER BY "countries"."id" LIMIT $2`)).
		WithArgs(1, 1).
		WillReturnRows(sqlmock.NewRows([]string{"id", "code", "name", "currency_code", "timezone"}).
			AddRow(1, "ID", "Indonesia", "IDR", "Asia/Jakarta"))

	svc := NewCountryService(dao.NewBase[Country](db))
	country, err := svc.FindCountry(context.Background(), 1)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if country == nil || country.Code != "ID" {
		t.Fatalf("country = %+v, want code ID", country)
	}

	query.AssertDBMockDone(t, mock)
}

func TestCountryService_SearchCountry_PropagatesError(t *testing.T) {
	db, mock := query.NewMockDB(t)
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "countries" WHERE code = $1 LIMIT $2`)).
		WithArgs("ID", 1).
		WillReturnError(errors.New("db down"))

	svc := NewCountryService(dao.NewBase[Country](db))
	if _, err := svc.SearchCountry(context.Background(), "code", "ID"); err == nil {
		t.Fatal("expected error, got nil")
	}

	query.AssertDBMockDone(t, mock)
}
