package handler

import (
	"context"
	"errors"
	"net/http"
	"testing"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/localization"
)

func TestProfileHandler_Get_Success(t *testing.T) {
	app := localizationTestApp(localization.ProfileDAOMock{
		CRUDMock: dao.CRUDMock[localization.Profile]{
			FindFunc: func(_ context.Context, id uint64) (*localization.Profile, error) {
				return sampleLocalizationProfile(id), nil
			},
		},
	}, localization.TaxTemplateLineDAOMock{}, localization.OrganizationUpdaterMock{})

	resp := localizationDoRequest(t, app, http.MethodGet, "/localization-profiles/1", "")
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
}

func TestProfileHandler_Get_InvalidID(t *testing.T) {
	app := localizationTestApp(localization.ProfileDAOMock{}, localization.TaxTemplateLineDAOMock{}, localization.OrganizationUpdaterMock{})

	resp := localizationDoRequest(t, app, http.MethodGet, "/localization-profiles/not-a-number", "")
	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want 422", resp.StatusCode)
	}
}

func TestProfileHandler_Update_Success(t *testing.T) {
	app := localizationTestApp(localization.ProfileDAOMock{
		CRUDMock: dao.CRUDMock[localization.Profile]{
			FindFunc: func(_ context.Context, id uint64) (*localization.Profile, error) {
				return sampleLocalizationProfile(id), nil
			},
			SearchFunc: func(_ context.Context, _ string, _ any) (*localization.Profile, error) { return nil, nil },
			UpdateFunc: func(_ context.Context, profile *localization.Profile) (*localization.Profile, error) {
				return profile, nil
			},
		},
	}, localization.TaxTemplateLineDAOMock{}, localization.OrganizationUpdaterMock{})

	body := `{"name":"Indonesia","country_code":"ID","currency_code":"IDR","timezone":"Asia/Jakarta","tax_year_start_month":1}`
	resp := localizationDoRequest(t, app, http.MethodPut, "/localization-profiles/1", body)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
}

func TestProfileHandler_Update_InvalidID(t *testing.T) {
	app := localizationTestApp(localization.ProfileDAOMock{}, localization.TaxTemplateLineDAOMock{}, localization.OrganizationUpdaterMock{})

	resp := localizationDoRequest(t, app, http.MethodPut, "/localization-profiles/bad", `{}`)
	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want 422", resp.StatusCode)
	}
}

func TestProfileHandler_Update_NotFound(t *testing.T) {
	app := localizationTestApp(localization.ProfileDAOMock{}, localization.TaxTemplateLineDAOMock{}, localization.OrganizationUpdaterMock{})

	body := `{"name":"Indonesia","country_code":"ID","currency_code":"IDR","tax_year_start_month":1}`
	resp := localizationDoRequest(t, app, http.MethodPut, "/localization-profiles/99", body)
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", resp.StatusCode)
	}
}

func TestProfileHandler_Delete_Success(t *testing.T) {
	app := localizationTestApp(localization.ProfileDAOMock{
		CRUDMock: dao.CRUDMock[localization.Profile]{
			FindFunc: func(_ context.Context, id uint64) (*localization.Profile, error) {
				return &localization.Profile{Base: model.Base{ID: id}}, nil
			},
		},
	}, localization.TaxTemplateLineDAOMock{}, localization.OrganizationUpdaterMock{})

	resp := localizationDoRequest(t, app, http.MethodDelete, "/localization-profiles/1", "")
	if resp.StatusCode != http.StatusNoContent {
		t.Fatalf("status = %d, want 204", resp.StatusCode)
	}
}

func TestProfileHandler_Delete_InvalidID(t *testing.T) {
	app := localizationTestApp(localization.ProfileDAOMock{}, localization.TaxTemplateLineDAOMock{}, localization.OrganizationUpdaterMock{})

	resp := localizationDoRequest(t, app, http.MethodDelete, "/localization-profiles/bad", "")
	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want 422", resp.StatusCode)
	}
}

func TestProfileHandler_Delete_NotFound(t *testing.T) {
	app := localizationTestApp(localization.ProfileDAOMock{}, localization.TaxTemplateLineDAOMock{}, localization.OrganizationUpdaterMock{})

	resp := localizationDoRequest(t, app, http.MethodDelete, "/localization-profiles/99", "")
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", resp.StatusCode)
	}
}

func TestProfileHandler_ListTaxTemplates_Success(t *testing.T) {
	app := localizationTestApp(localization.ProfileDAOMock{
		CRUDMock: dao.CRUDMock[localization.Profile]{
			FindFunc: func(_ context.Context, id uint64) (*localization.Profile, error) {
				return sampleLocalizationProfile(id), nil
			},
		},
	}, localization.TaxTemplateLineDAOMock{
		ListByProfileFunc: func(_ context.Context, profileID uint64) ([]*localization.TaxTemplateLine, error) {
			return []*localization.TaxTemplateLine{{
				Base:      model.Base{ID: 1},
				ProfileID: profileID,
				Name:      "PPN 11%",
				Kind:      localization.TaxKindSale,
				Rate:      11,
			}}, nil
		},
	}, localization.OrganizationUpdaterMock{})

	resp := localizationDoRequest(t, app, http.MethodGet, "/localization-profiles/1/tax-templates", "")
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
}

func TestProfileHandler_ListTaxTemplates_InvalidID(t *testing.T) {
	app := localizationTestApp(localization.ProfileDAOMock{}, localization.TaxTemplateLineDAOMock{}, localization.OrganizationUpdaterMock{})

	resp := localizationDoRequest(t, app, http.MethodGet, "/localization-profiles/bad/tax-templates", "")
	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want 422", resp.StatusCode)
	}
}

func TestProfileHandler_ListTaxTemplates_NotFound(t *testing.T) {
	app := localizationTestApp(localization.ProfileDAOMock{}, localization.TaxTemplateLineDAOMock{}, localization.OrganizationUpdaterMock{})

	resp := localizationDoRequest(t, app, http.MethodGet, "/localization-profiles/99/tax-templates", "")
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", resp.StatusCode)
	}
}

func TestProfileHandler_ReplaceTaxTemplates_Success(t *testing.T) {
	app := localizationTestApp(localization.ProfileDAOMock{
		CRUDMock: dao.CRUDMock[localization.Profile]{
			FindFunc: func(_ context.Context, id uint64) (*localization.Profile, error) {
				return sampleLocalizationProfile(id), nil
			},
		},
	}, localization.TaxTemplateLineDAOMock{
		ReplaceForProfileFunc: func(_ context.Context, _ uint64, _ []*localization.TaxTemplateLine) error {
			return nil
		},
		ListByProfileFunc: func(_ context.Context, profileID uint64) ([]*localization.TaxTemplateLine, error) {
			return []*localization.TaxTemplateLine{{
				Base:      model.Base{ID: 1},
				ProfileID: profileID,
				Name:      "PPN 11%",
				Kind:      localization.TaxKindSale,
				Rate:      11,
			}}, nil
		},
	}, localization.OrganizationUpdaterMock{})

	body := `{"lines":[{"name":"PPN 11%","kind":"sale","rate":11}]}`
	resp := localizationDoRequest(t, app, http.MethodPut, "/localization-profiles/1/tax-templates", body)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
}

func TestProfileHandler_ReplaceTaxTemplates_InvalidID(t *testing.T) {
	app := localizationTestApp(localization.ProfileDAOMock{}, localization.TaxTemplateLineDAOMock{}, localization.OrganizationUpdaterMock{})

	resp := localizationDoRequest(t, app, http.MethodPut, "/localization-profiles/bad/tax-templates", `{}`)
	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want 422", resp.StatusCode)
	}
}

func TestProfileHandler_ReplaceTaxTemplates_InvalidKind(t *testing.T) {
	app := localizationTestApp(localization.ProfileDAOMock{
		CRUDMock: dao.CRUDMock[localization.Profile]{
			FindFunc: func(_ context.Context, id uint64) (*localization.Profile, error) {
				return sampleLocalizationProfile(id), nil
			},
		},
	}, localization.TaxTemplateLineDAOMock{}, localization.OrganizationUpdaterMock{})

	body := `{"lines":[{"name":"VAT","kind":"other","rate":11}]}`
	resp := localizationDoRequest(t, app, http.MethodPut, "/localization-profiles/1/tax-templates", body)
	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want 422", resp.StatusCode)
	}
}

func TestProfileHandler_List_Error(t *testing.T) {
	app := localizationTestApp(localization.ProfileDAOMock{
		CRUDMock: dao.CRUDMock[localization.Profile]{
			ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[localization.Profile], error) {
				return nil, errors.New("list failed")
			},
		},
	}, localization.TaxTemplateLineDAOMock{}, localization.OrganizationUpdaterMock{})

	resp := localizationDoRequest(t, app, http.MethodGet, "/localization-profiles/", "")
	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500", resp.StatusCode)
	}
}
