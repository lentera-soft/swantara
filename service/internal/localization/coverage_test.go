package localization

import (
	"context"
	"errors"
	"testing"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
)

func TestProfileService_ListProfiles(t *testing.T) {
	svc := NewProfileService(profileMock(dao.CRUDMock[Profile]{
		ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[Profile], error) {
			return &query.Page[Profile]{Items: []*Profile{ProfileFixture()}, Count: 1}, nil
		},
	}), TaxTemplateLineDAOMock{}, OrganizationUpdaterMock{})

	page, err := svc.ListProfiles(context.Background(), &query.Query{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if page.Count != 1 {
		t.Fatalf("count = %d, want 1", page.Count)
	}
}

func TestProfileService_FindProfile(t *testing.T) {
	want := ProfileFixture()
	svc := NewProfileService(profileMock(dao.CRUDMock[Profile]{
		FindFunc: func(_ context.Context, _ uint64) (*Profile, error) { return want, nil },
	}), TaxTemplateLineDAOMock{}, OrganizationUpdaterMock{})

	got, err := svc.FindProfile(context.Background(), want.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != want {
		t.Fatal("expected the same profile")
	}
}

func TestProfileService_UpdateProfile_Success(t *testing.T) {
	svc := NewProfileService(profileMock(dao.CRUDMock[Profile]{
		FindFunc: func(_ context.Context, id uint64) (*Profile, error) {
			return ProfileFixture(func(p *Profile) *Profile { p.ID = id; return p }), nil
		},
		SearchFunc: func(_ context.Context, _ string, _ any) (*Profile, error) { return nil, nil },
		UpdateFunc: func(_ context.Context, p *Profile) (*Profile, error) { return p, nil },
	}), TaxTemplateLineDAOMock{}, OrganizationUpdaterMock{})

	profile := ProfileFixture(func(p *Profile) *Profile {
		p.ID = 7
		p.CountryCode = "ID"
		p.CurrencyCode = "IDR"
		return p
	})
	updated, err := svc.UpdateProfile(context.Background(), profile)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated == nil || updated.ID != 7 {
		t.Fatalf("unexpected updated profile: %+v", updated)
	}
}

func TestProfileService_UpdateProfile_SearchError(t *testing.T) {
	wantErr := errors.New("search failed")
	svc := NewProfileService(profileMock(dao.CRUDMock[Profile]{
		SearchFunc: func(_ context.Context, _ string, _ any) (*Profile, error) { return nil, wantErr },
	}), TaxTemplateLineDAOMock{}, OrganizationUpdaterMock{})

	_, err := svc.UpdateProfile(context.Background(), &Profile{Name: "Indonesia", CountryCode: "ID", CurrencyCode: "IDR", TaxYearStartMonth: 1})
	if !errors.Is(err, wantErr) {
		t.Fatalf("err = %v, want %v", err, wantErr)
	}
}

func TestProfileService_DeleteProfile(t *testing.T) {
	t.Run("deletes existing profile", func(t *testing.T) {
		deleted := false
		svc := NewProfileService(profileMock(dao.CRUDMock[Profile]{
			FindFunc: func(_ context.Context, id uint64) (*Profile, error) { return &Profile{Base: profileBaseFor(id)}, nil },
			DeleteFunc: func(_ context.Context, _ uint64) error {
				deleted = true
				return nil
			},
		}), TaxTemplateLineDAOMock{}, OrganizationUpdaterMock{})
		if err := svc.DeleteProfile(context.Background(), 1); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if !deleted {
			t.Fatal("expected delete to be called")
		}
	})

	t.Run("missing profile", func(t *testing.T) {
		svc := NewProfileService(ProfileDAOMock{}, TaxTemplateLineDAOMock{}, OrganizationUpdaterMock{})
		if err := svc.DeleteProfile(context.Background(), 1); !errors.Is(err, ErrProfileNotFound) {
			t.Fatalf("err = %v, want ErrProfileNotFound", err)
		}
	})

	t.Run("find error", func(t *testing.T) {
		wantErr := errors.New("find failed")
		svc := NewProfileService(profileMock(dao.CRUDMock[Profile]{
			FindFunc: func(_ context.Context, _ uint64) (*Profile, error) { return nil, wantErr },
		}), TaxTemplateLineDAOMock{}, OrganizationUpdaterMock{})
		if err := svc.DeleteProfile(context.Background(), 1); !errors.Is(err, wantErr) {
			t.Fatalf("err = %v, want %v", err, wantErr)
		}
	})
}

func TestProfileService_ListTaxTemplateLines(t *testing.T) {
	line := TaxTemplateLineFixture()
	svc := NewProfileService(profileMock(dao.CRUDMock[Profile]{
		FindFunc: func(_ context.Context, id uint64) (*Profile, error) { return &Profile{Base: profileBaseFor(id)}, nil },
	}), TaxTemplateLineDAOMock{
		ListByProfileFunc: func(_ context.Context, profileID uint64) ([]*TaxTemplateLine, error) {
			return []*TaxTemplateLine{line}, nil
		},
	}, OrganizationUpdaterMock{})

	lines, err := svc.ListTaxTemplateLines(context.Background(), 1)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(lines) != 1 || lines[0] != line {
		t.Fatalf("unexpected lines: %+v", lines)
	}
}

func TestProfileService_ListTaxTemplateLines_NotFound(t *testing.T) {
	svc := NewProfileService(ProfileDAOMock{}, TaxTemplateLineDAOMock{}, OrganizationUpdaterMock{})
	if _, err := svc.ListTaxTemplateLines(context.Background(), 1); !errors.Is(err, ErrProfileNotFound) {
		t.Fatalf("err = %v, want ErrProfileNotFound", err)
	}
}

func TestProfileService_ReplaceTaxTemplateLines_Success(t *testing.T) {
	svc := NewProfileService(profileMock(dao.CRUDMock[Profile]{
		FindFunc: func(_ context.Context, id uint64) (*Profile, error) { return &Profile{Base: profileBaseFor(id)}, nil },
	}), TaxTemplateLineDAOMock{
		ReplaceForProfileFunc: func(_ context.Context, profileID uint64, lines []*TaxTemplateLine) error {
			if profileID != 1 || len(lines) != 1 {
				t.Fatalf("unexpected replace args: %d %d", profileID, len(lines))
			}
			return nil
		},
		ListByProfileFunc: func(_ context.Context, _ uint64) ([]*TaxTemplateLine, error) {
			return []*TaxTemplateLine{TaxTemplateLineFixture()}, nil
		},
	}, OrganizationUpdaterMock{})

	lines, err := svc.ReplaceTaxTemplateLines(context.Background(), 1, []*TaxTemplateLine{{Name: "VAT", Kind: TaxKindSale, Rate: 11}})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(lines) != 1 {
		t.Fatalf("len(lines) = %d, want 1", len(lines))
	}
}

func TestProfileService_ReplaceTaxTemplateLines_Errors(t *testing.T) {
	t.Run("missing profile", func(t *testing.T) {
		svc := NewProfileService(ProfileDAOMock{}, TaxTemplateLineDAOMock{}, OrganizationUpdaterMock{})
		if _, err := svc.ReplaceTaxTemplateLines(context.Background(), 1, nil); !errors.Is(err, ErrProfileNotFound) {
			t.Fatalf("err = %v, want ErrProfileNotFound", err)
		}
	})

	t.Run("empty name", func(t *testing.T) {
		svc := NewProfileService(profileMock(dao.CRUDMock[Profile]{
			FindFunc: func(_ context.Context, id uint64) (*Profile, error) { return &Profile{Base: profileBaseFor(id)}, nil },
		}), TaxTemplateLineDAOMock{}, OrganizationUpdaterMock{})
		if _, err := svc.ReplaceTaxTemplateLines(context.Background(), 1, []*TaxTemplateLine{{Kind: TaxKindSale}}); !errors.Is(err, ErrTaxTemplateLineName) {
			t.Fatalf("err = %v, want ErrTaxTemplateLineName", err)
		}
	})

	t.Run("negative rate", func(t *testing.T) {
		svc := NewProfileService(profileMock(dao.CRUDMock[Profile]{
			FindFunc: func(_ context.Context, id uint64) (*Profile, error) { return &Profile{Base: profileBaseFor(id)}, nil },
		}), TaxTemplateLineDAOMock{}, OrganizationUpdaterMock{})
		if _, err := svc.ReplaceTaxTemplateLines(context.Background(), 1, []*TaxTemplateLine{{Name: "VAT", Kind: TaxKindPurchase, Rate: -1}}); !errors.Is(err, ErrTaxTemplateRateInvalid) {
			t.Fatalf("err = %v, want ErrTaxTemplateRateInvalid", err)
		}
	})
}

func TestApplyProfile_Errors(t *testing.T) {
	t.Run("profile lookup error", func(t *testing.T) {
		wantErr := errors.New("find failed")
		svc := NewProfileService(profileMock(dao.CRUDMock[Profile]{
			FindFunc: func(_ context.Context, _ uint64) (*Profile, error) { return nil, wantErr },
		}), TaxTemplateLineDAOMock{}, OrganizationUpdaterMock{})
		if _, err := svc.ApplyProfile(context.Background(), 1, 2); !errors.Is(err, wantErr) {
			t.Fatalf("err = %v, want %v", err, wantErr)
		}
	})

	t.Run("profile missing", func(t *testing.T) {
		svc := NewProfileService(ProfileDAOMock{}, TaxTemplateLineDAOMock{}, OrganizationUpdaterMock{})
		if _, err := svc.ApplyProfile(context.Background(), 1, 2); !errors.Is(err, ErrProfileNotFound) {
			t.Fatalf("err = %v, want ErrProfileNotFound", err)
		}
	})

	t.Run("updater error", func(t *testing.T) {
		wantErr := errors.New("apply failed")
		svc := NewProfileService(profileMock(dao.CRUDMock[Profile]{
			FindFunc: func(_ context.Context, id uint64) (*Profile, error) {
				return ProfileFixture(func(p *Profile) *Profile {
					p.Base = profileBaseFor(id)
					p.Active = true
					return p
				}), nil
			},
		}), TaxTemplateLineDAOMock{}, OrganizationUpdaterMock{
			ApplyLocalizationFunc: func(_ context.Context, _ uint64, _, _, _ string, _ int16) error { return wantErr },
		})
		if _, err := svc.ApplyProfile(context.Background(), 1, 2); !errors.Is(err, wantErr) {
			t.Fatalf("err = %v, want %v", err, wantErr)
		}
	})
}

func TestIsAlphaCode(t *testing.T) {
	tests := []struct {
		value  string
		length int
		want   bool
	}{
		{"ID", 2, true},
		{"id", 2, false},
		{"IDR", 3, true},
		{"ID", 3, false},
		{"I1", 2, false},
		{"", 0, true},
	}
	for _, tt := range tests {
		if got := isAlphaCode(tt.value, tt.length); got != tt.want {
			t.Errorf("isAlphaCode(%q, %d) = %v, want %v", tt.value, tt.length, got, tt.want)
		}
	}
}

func TestLocalizationTableNames(t *testing.T) {
	if got := (Profile{}).TableName(); got != "localization_profiles" {
		t.Fatalf("Profile.TableName() = %q", got)
	}
	if got := (TaxTemplateLine{}).TableName(); got != "localization_tax_template_lines" {
		t.Fatalf("TaxTemplateLine.TableName() = %q", got)
	}
}
