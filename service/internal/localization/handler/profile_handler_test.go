package handler

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/localization"
)

func localizationTestApp(profiles localization.ProfileDAOMock, lines localization.TaxTemplateLineDAOMock, updater localization.OrganizationUpdaterMock) *fiber.App {
	app := fiber.New()
	h := NewProfileHandler(localization.NewProfileService(profiles, lines, updater))
	h.Register(app, localizationGuards())
	h.RegisterOrg(app, localizationGuards())
	return app
}

func localizationGuards() httpx.RouteGuards {
	return httpx.RouteGuards{
		AuthN: func(c fiber.Ctx) error {
			c.Locals(httpx.LocalOrganizationID, uint64(1))
			return c.Next()
		},
		Guard: func(_, _ string) fiber.Handler {
			return func(c fiber.Ctx) error { return c.Next() }
		},
	}
}

func localizationDoRequest(t *testing.T, app *fiber.App, method, path, body string) *http.Response {
	t.Helper()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	return resp
}

func sampleLocalizationProfile(id uint64) *localization.Profile {
	return &localization.Profile{
		Base:              model.Base{ID: id},
		Name:              "Indonesia",
		CountryCode:       "ID",
		CurrencyCode:      "IDR",
		Locale:            "id-ID",
		Timezone:          "Asia/Jakarta",
		DateFormat:        "DD/MM/YYYY",
		TaxYearStartMonth: 1,
		Active:            true,
	}
}

func TestProfileHandler_List_ReturnsProfiles(t *testing.T) {
	app := localizationTestApp(localization.ProfileDAOMock{
		CRUDMock: dao.CRUDMock[localization.Profile]{
			ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[localization.Profile], error) {
				return &query.Page[localization.Profile]{Items: []*localization.Profile{sampleLocalizationProfile(1)}, Count: 1}, nil
			},
		},
	}, localization.TaxTemplateLineDAOMock{}, localization.OrganizationUpdaterMock{})

	resp := localizationDoRequest(t, app, http.MethodGet, "/localization-profiles/", "")
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
}

func TestProfileHandler_List_RejectsInvalidQuery(t *testing.T) {
	app := localizationTestApp(localization.ProfileDAOMock{}, localization.TaxTemplateLineDAOMock{}, localization.OrganizationUpdaterMock{})

	resp := localizationDoRequest(t, app, http.MethodGet, "/localization-profiles/?filter=bogus:eq:x", "")
	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want 422", resp.StatusCode)
	}
}

func TestProfileHandler_Create_ReturnsCreated(t *testing.T) {
	app := localizationTestApp(localization.ProfileDAOMock{
		CRUDMock: dao.CRUDMock[localization.Profile]{
			CreateFunc: func(_ context.Context, entity *localization.Profile) (*localization.Profile, error) {
				entity.Base = model.Base{ID: 1}
				return entity, nil
			},
		},
	}, localization.TaxTemplateLineDAOMock{}, localization.OrganizationUpdaterMock{})

	body := `{"name":"Indonesia","country_code":"ID","currency_code":"IDR","timezone":"Asia/Jakarta","tax_year_start_month":1}`
	resp := localizationDoRequest(t, app, http.MethodPost, "/localization-profiles/", body)
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("status = %d, want 201", resp.StatusCode)
	}
}

func TestProfileHandler_Create_InvalidCountry(t *testing.T) {
	app := localizationTestApp(localization.ProfileDAOMock{}, localization.TaxTemplateLineDAOMock{}, localization.OrganizationUpdaterMock{})

	body := `{"name":"Indonesia","country_code":"IND","currency_code":"IDR","tax_year_start_month":1}`
	resp := localizationDoRequest(t, app, http.MethodPost, "/localization-profiles/", body)
	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want 422", resp.StatusCode)
	}
}

func TestProfileHandler_Get_NotFound(t *testing.T) {
	app := localizationTestApp(localization.ProfileDAOMock{}, localization.TaxTemplateLineDAOMock{}, localization.OrganizationUpdaterMock{})

	resp := localizationDoRequest(t, app, http.MethodGet, "/localization-profiles/99", "")
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", resp.StatusCode)
	}
}

func TestProfileHandler_Apply_Applies(t *testing.T) {
	app := localizationTestApp(localization.ProfileDAOMock{
		CRUDMock: dao.CRUDMock[localization.Profile]{
			FindFunc: func(_ context.Context, id uint64) (*localization.Profile, error) {
				return sampleLocalizationProfile(id), nil
			},
		},
	}, localization.TaxTemplateLineDAOMock{}, localization.OrganizationUpdaterMock{
		ApplyLocalizationFunc: func(_ context.Context, _ uint64, _, _, _ string, _ int16) error {
			return nil
		},
	})

	resp := localizationDoRequest(t, app, http.MethodPost, "/localization-profiles/1/apply", "")
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
}
