package handler

import (
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

func deniedGuards() httpx.RouteGuards {
	return httpx.RouteGuards{
		AuthN: func(c fiber.Ctx) error {
			return c.SendStatus(http.StatusUnauthorized)
		},
		Guard: func(_, _ string) fiber.Handler {
			return func(c fiber.Ctx) error {
				return c.SendStatus(http.StatusUnauthorized)
			}
		},
	}
}

func publicTestApp(register func(api fiber.Router, guards httpx.RouteGuards)) *fiber.App {
	app := fiber.New()
	register(app, deniedGuards())
	return app
}

func TestCountryHandler_List_IsPublic(t *testing.T) {
	db, mock := query.NewMockDB(t)
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT count(*) FROM "countries"`)).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "countries" LIMIT $1`)).
		WithArgs(20).
		WillReturnRows(sqlmock.NewRows(countryColumns).
			AddRow(1, timeNow(), timeNow(), nil, "ID", "Indonesia", "IDR", "Asia/Jakarta"))
	app := publicTestApp(func(api fiber.Router, guards httpx.RouteGuards) {
		NewCountryHandler(reference.NewCountryService(dao.NewBase[reference.Country](db))).Register(api, guards)
	})

	resp, err := doRequest(app, http.MethodGet, "/countries/", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
	query.AssertDBMockDone(t, mock)
}

func TestCurrencyHandler_List_IsPublic(t *testing.T) {
	db, mock := query.NewMockDB(t)
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT count(*) FROM "currencies"`)).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "currencies" LIMIT $1`)).
		WithArgs(20).
		WillReturnRows(sqlmock.NewRows(currencyColumns).
			AddRow(1, timeNow(), timeNow(), nil, "IDR", "Indonesian Rupiah", "Rp", 2, 0.01))
	app := publicTestApp(func(api fiber.Router, guards httpx.RouteGuards) {
		NewCurrencyHandler(reference.NewFxRateService(dao.NewBase[reference.FxRate](nil), dao.NewBase[reference.Currency](db))).Register(api, guards)
	})

	resp, err := doRequest(app, http.MethodGet, "/currencies/", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
	query.AssertDBMockDone(t, mock)
}

func TestUnitGroupHandler_List_IsPublic(t *testing.T) {
	db, mock := query.NewMockDB(t)
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT count(*) FROM "unit_groups"`)).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "unit_groups" LIMIT $1`)).
		WithArgs(20).
		WillReturnRows(sqlmock.NewRows(unitGroupColumns).
			AddRow(1, timeNow(), timeNow(), nil, "Weight"))
	app := publicTestApp(func(api fiber.Router, guards httpx.RouteGuards) {
		NewUnitGroupHandler(reference.NewUnitService(dao.NewBase[reference.UnitGroup](db), dao.NewBase[reference.Unit](nil))).Register(api, guards)
	})

	resp, err := doRequest(app, http.MethodGet, "/unit-groups/", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
	query.AssertDBMockDone(t, mock)
}

func TestUnitHandler_List_IsPublic(t *testing.T) {
	db, mock := query.NewMockDB(t)
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT count(*) FROM "units"`)).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "units" LIMIT $1`)).
		WithArgs(20).
		WillReturnRows(sqlmock.NewRows(uomColumns).
			AddRow(1, timeNow(), timeNow(), nil, 1, "kg", 1.0, "", 0.001))
	app := publicTestApp(func(api fiber.Router, guards httpx.RouteGuards) {
		NewUnitHandler(reference.NewUnitService(dao.NewBase[reference.UnitGroup](nil), dao.NewBase[reference.Unit](db))).Register(api, guards)
	})

	resp, err := doRequest(app, http.MethodGet, "/units/", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
	query.AssertDBMockDone(t, mock)
}

func TestReferenceWrites_RequireAuth(t *testing.T) {
	tests := []struct {
		name   string
		method string
		path   string
		body   string
	}{
		{
			name:   "unit group create",
			method: http.MethodPost,
			path:   "/unit-groups/",
			body:   `{"name":"Weight"}`,
		},
		{
			name:   "unit create",
			method: http.MethodPost,
			path:   "/units/",
			body:   `{}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, mock := query.NewMockDB(t)
			app := publicTestApp(func(api fiber.Router, guards httpx.RouteGuards) {
				if tt.path == "/unit-groups/" {
					NewUnitGroupHandler(reference.NewUnitService(dao.NewBase[reference.UnitGroup](db), dao.NewBase[reference.Unit](nil))).Register(api, guards)
					return
				}
				NewUnitHandler(reference.NewUnitService(dao.NewBase[reference.UnitGroup](nil), dao.NewBase[reference.Unit](db))).Register(api, guards)
			})

			resp, err := doRequest(app, tt.method, tt.path, tt.body)
			if err != nil {
				t.Fatal(err)
			}
			if resp.StatusCode != http.StatusUnauthorized {
				t.Fatalf("status = %d, want 401", resp.StatusCode)
			}
			query.AssertDBMockDone(t, mock)
		})
	}
}
