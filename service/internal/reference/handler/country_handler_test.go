package handler

import (
	"errors"
	"net/http"
	"regexp"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

var countryColumns = []string{"id", "created_at", "updated_at", "deleted_at", "code", "name", "currency_code", "timezone"}

func countryHandlerTest(t *testing.T, countries dao.Base[reference.Country]) *fiber.App {
	t.Helper()
	return referenceTestApp(t, true, func(api fiber.Router, guards httpx.RouteGuards) {
		h := NewCountryHandler(reference.NewCountryService(countries))
		h.Register(api, guards)
	})
}

func TestCountryHandler_List_ReturnsCountries(t *testing.T) {
	db, mock := query.NewMockDB(t)
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT count(*) FROM "countries"`)).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "countries" LIMIT $1`)).
		WithArgs(20).
		WillReturnRows(sqlmock.NewRows(countryColumns).
			AddRow(1, timeNow(), timeNow(), nil, "ID", "Indonesia", "IDR", "Asia/Jakarta"))
	app := countryHandlerTest(t, dao.NewBase[reference.Country](db))

	resp, err := doRequest(app, http.MethodGet, "/countries/", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
	query.AssertDBMockDone(t, mock)
}

func TestCountryHandler_List_RejectsInvalidQuery(t *testing.T) {
	db, mock := query.NewMockDB(t)
	app := countryHandlerTest(t, dao.NewBase[reference.Country](db))

	resp, err := doRequest(app, http.MethodGet, "/countries/?filter=bogus:eq:x", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want 422", resp.StatusCode)
	}
	query.AssertDBMockDone(t, mock)
}

func TestCountryHandler_List_ReturnsServerError(t *testing.T) {
	db, mock := query.NewMockDB(t)
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT count(*) FROM "countries"`)).
		WillReturnError(errors.New("db down"))
	app := countryHandlerTest(t, dao.NewBase[reference.Country](db))

	resp, err := doRequest(app, http.MethodGet, "/countries/", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500", resp.StatusCode)
	}
	query.AssertDBMockDone(t, mock)
}

func TestCountryHandler_List_ExportsCSV(t *testing.T) {
	db, mock := query.NewMockDB(t)
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT count(*) FROM "countries"`)).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "countries" LIMIT $1`)).
		WithArgs(20).
		WillReturnRows(sqlmock.NewRows(countryColumns).
			AddRow(1, timeNow(), timeNow(), nil, "ID", "Indonesia", "IDR", "Asia/Jakarta"))
	app := countryHandlerTest(t, dao.NewBase[reference.Country](db))

	resp, err := doRequest(app, http.MethodGet, "/countries/?format=csv", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
	query.AssertDBMockDone(t, mock)
}

func TestCountryHandler_Get_ReturnsCountry(t *testing.T) {
	db, mock := query.NewMockDB(t)
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "countries" WHERE code = $1 LIMIT $2`)).
		WithArgs("ID", 1).
		WillReturnRows(sqlmock.NewRows(countryColumns).
			AddRow(1, timeNow(), timeNow(), nil, "ID", "Indonesia", "IDR", "Asia/Jakarta"))
	app := countryHandlerTest(t, dao.NewBase[reference.Country](db))

	resp, err := doRequest(app, http.MethodGet, "/countries/id", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
	query.AssertDBMockDone(t, mock)
}

func TestCountryHandler_Get_ReturnsNotFound(t *testing.T) {
	db, mock := query.NewMockDB(t)
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "countries" WHERE code = $1 LIMIT $2`)).
		WithArgs("XX", 1).
		WillReturnRows(sqlmock.NewRows(countryColumns))
	app := countryHandlerTest(t, dao.NewBase[reference.Country](db))

	resp, err := doRequest(app, http.MethodGet, "/countries/xx", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", resp.StatusCode)
	}
	query.AssertDBMockDone(t, mock)
}

func TestCountryHandler_Get_ReturnsServerError(t *testing.T) {
	db, mock := query.NewMockDB(t)
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "countries" WHERE code = $1 LIMIT $2`)).
		WithArgs("ID", 1).
		WillReturnError(errors.New("db down"))
	app := countryHandlerTest(t, dao.NewBase[reference.Country](db))

	resp, err := doRequest(app, http.MethodGet, "/countries/ID", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500", resp.StatusCode)
	}
	query.AssertDBMockDone(t, mock)
}
