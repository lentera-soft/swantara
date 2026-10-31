package inquiry

import (
	"context"
	"errors"
	"testing"

	"github.com/jalusw/swantara/apps/service/internal/crm"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
)

func TestContactInquiryServiceCreate(t *testing.T) {
	tests := []struct {
		name    string
		request CreateContactInquiryRequest
		wantErr error
	}{
		{
			name:    "rejects a blank name",
			request: CreateContactInquiryRequest{Name: "  ", Email: "a@b.co", Message: "hi"},
			wantErr: ErrNameRequired,
		},
		{
			name:    "rejects a blank email",
			request: CreateContactInquiryRequest{Name: "Ada", Email: " ", Message: "hi"},
			wantErr: ErrEmailRequired,
		},
		{
			name:    "rejects a blank message",
			request: CreateContactInquiryRequest{Name: "Ada", Email: "a@b.co", Message: " "},
			wantErr: ErrMessageRequired,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := NewContactInquiryService(dao.CRUDMock[ContactInquiry]{})
			_, err := svc.Create(context.Background(), tt.request)
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("err = %v, want %v", err, tt.wantErr)
			}
		})
	}
}

func TestContactInquiryServiceCreateTrimsAndStores(t *testing.T) {
	var captured *ContactInquiry
	svc := NewContactInquiryService(dao.CRUDMock[ContactInquiry]{
		CreateFunc: func(_ context.Context, entity *ContactInquiry) (*ContactInquiry, error) {
			captured = entity
			entity.ID = 7
			return entity, nil
		},
	})

	company := "  Acme  "
	created, err := svc.Create(context.Background(), CreateContactInquiryRequest{
		Name:    "  Ada Lovelace  ",
		Email:   "  ada@example.com ",
		Company: &company,
		Message: "  Hello there  ",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if captured == nil || captured != created {
		t.Fatal("expected the created entity to be returned")
	}
	if captured.Name != "Ada Lovelace" {
		t.Errorf("name = %q", captured.Name)
	}
	if captured.Email != "ada@example.com" {
		t.Errorf("email = %q", captured.Email)
	}
	if captured.Message != "Hello there" {
		t.Errorf("message = %q", captured.Message)
	}
	if captured.Company == nil || *captured.Company != "Acme" {
		t.Errorf("company = %v", captured.Company)
	}
	if captured.Status != StatusNew {
		t.Errorf("status = %q, want %q", captured.Status, StatusNew)
	}
}

func TestContactInquiryServiceCreateDropsBlankCompany(t *testing.T) {
	var captured *ContactInquiry
	svc := NewContactInquiryService(dao.CRUDMock[ContactInquiry]{
		CreateFunc: func(_ context.Context, entity *ContactInquiry) (*ContactInquiry, error) {
			captured = entity
			return entity, nil
		},
	})

	company := "   "
	if _, err := svc.Create(context.Background(), CreateContactInquiryRequest{
		Name:    "Ada",
		Email:   "ada@example.com",
		Company: &company,
		Message: "Hello",
	}); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if captured.Company != nil {
		t.Errorf("company = %v, want nil", *captured.Company)
	}
}

type fakeLeadCreator struct {
	created *crm.Prospect
	err     error
}

func (f *fakeLeadCreator) CreateLead(_ context.Context, prospect *crm.Prospect) (*crm.Prospect, error) {
	if f.err != nil {
		return nil, f.err
	}
	f.created = prospect
	prospect.ID = 42
	return prospect, nil
}

func TestContactInquiryServiceConvertCreatesAndLinksLead(t *testing.T) {
	company := "Acme"
	orgID := uint64(10)
	inquiry := &ContactInquiry{
		Base:           model.Base{ID: 5},
		OrganizationID: &orgID,
		Name:           "Ada Lovelace",
		Email:          "ada@example.com",
		Company:        &company,
		Message:        "Need a CRM",
		Status:         StatusNew,
		Source:         ptr("website"),
	}
	var updated *ContactInquiry
	svc := NewContactInquiryService(dao.CRUDMock[ContactInquiry]{
		FindFunc: func(_ context.Context, _ uint64) (*ContactInquiry, error) {
			return inquiry, nil
		},
		UpdateFunc: func(_ context.Context, entity *ContactInquiry) (*ContactInquiry, error) {
			updated = entity
			return entity, nil
		},
	})
	leads := &fakeLeadCreator{}
	svc = svc.WithLeadCreator(leads)

	_, lead, err := svc.Convert(context.Background(), 5, 10, ConvertInput{OrganizationID: 10})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if lead.ID != 42 || leads.created == nil {
		t.Fatal("expected a lead to be created")
	}
	if leads.created.Name != "Acme" {
		t.Errorf("lead name = %q, want Acme", leads.created.Name)
	}
	if leads.created.ContactName == nil || *leads.created.ContactName != "Ada Lovelace" {
		t.Errorf("contact name = %v", leads.created.ContactName)
	}
	if leads.created.NeedSummary == nil || *leads.created.NeedSummary != "Need a CRM" {
		t.Errorf("need summary = %v", leads.created.NeedSummary)
	}
	if leads.created.Source == nil || *leads.created.Source != "website" {
		t.Errorf("source = %v", leads.created.Source)
	}
	if updated == nil || updated.ProspectID == nil || *updated.ProspectID != 42 {
		t.Fatalf("inquiry was not linked: %+v", updated)
	}
	if updated.Status != StatusReviewed {
		t.Errorf("status = %q, want reviewed", updated.Status)
	}
	if updated.OrganizationID == nil || *updated.OrganizationID != 10 {
		t.Errorf("organization = %v, want 10", updated.OrganizationID)
	}
}

func TestContactInquiryServiceUpdateStatus(t *testing.T) {
	orgID := uint64(10)
	var updated *ContactInquiry
	svc := NewContactInquiryService(dao.CRUDMock[ContactInquiry]{
		FindFunc: func(_ context.Context, _ uint64) (*ContactInquiry, error) {
			return &ContactInquiry{
				Base:           model.Base{ID: 5},
				OrganizationID: &orgID,
				Status:         StatusNew,
			}, nil
		},
		UpdateFunc: func(_ context.Context, entity *ContactInquiry) (*ContactInquiry, error) {
			updated = entity
			return entity, nil
		},
	})

	result, err := svc.UpdateStatus(context.Background(), 5, 10, UpdateStatusInput{Status: StatusArchived})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated == nil || updated.Status != StatusArchived || result.Status != StatusArchived {
		t.Fatalf("status was not archived: %+v", updated)
	}
}

func TestContactInquiryServiceUpdateStatusRejectsInvalidStatus(t *testing.T) {
	svc := NewContactInquiryService(dao.CRUDMock[ContactInquiry]{})

	_, err := svc.UpdateStatus(context.Background(), 5, 10, UpdateStatusInput{Status: "lost"})
	if !errors.Is(err, ErrInvalidStatus) {
		t.Fatalf("err = %v, want %v", err, ErrInvalidStatus)
	}
}

func TestContactInquiryServiceConvertPropagatesDuplicate(t *testing.T) {
	orgID := uint64(10)
	updated := false
	svc := NewContactInquiryService(dao.CRUDMock[ContactInquiry]{
		FindFunc: func(_ context.Context, _ uint64) (*ContactInquiry, error) {
			return &ContactInquiry{
				Base:           model.Base{ID: 5},
				OrganizationID: &orgID,
				Name:           "Ada Lovelace",
				Email:          "ada@example.com",
				Message:        "Need a CRM",
			}, nil
		},
		UpdateFunc: func(_ context.Context, entity *ContactInquiry) (*ContactInquiry, error) {
			updated = true
			return entity, nil
		},
	}).WithLeadCreator(&fakeLeadCreator{err: crm.ErrDuplicateLead})

	_, _, err := svc.Convert(context.Background(), 5, 10, ConvertInput{OrganizationID: 10})
	if !errors.Is(err, crm.ErrDuplicateLead) {
		t.Fatalf("err = %v, want %v", err, crm.ErrDuplicateLead)
	}
	if updated {
		t.Fatal("inquiry should not be updated when lead creation fails")
	}
}

func TestContactInquiryServiceConvertRejectsAlreadyConverted(t *testing.T) {
	prospectID := uint64(42)
	orgID := uint64(10)
	svc := NewContactInquiryService(dao.CRUDMock[ContactInquiry]{
		FindFunc: func(_ context.Context, _ uint64) (*ContactInquiry, error) {
			return &ContactInquiry{Base: model.Base{ID: 5}, OrganizationID: &orgID, ProspectID: &prospectID}, nil
		},
	}).WithLeadCreator(&fakeLeadCreator{})

	_, _, err := svc.Convert(context.Background(), 5, 10, ConvertInput{OrganizationID: 10})
	if !errors.Is(err, ErrAlreadyConverted) {
		t.Fatalf("err = %v, want %v", err, ErrAlreadyConverted)
	}
}

type fakeConversionDAO struct {
	dao.CRUDMock[ContactInquiry]
	inquiry          *ContactInquiry
	claimErr         error
	linkErr          error
	claimID          string
	linkedProspectID uint64
	linkCalled       bool
	releaseCalled    bool
	releaseClaimID   string
}

func (f *fakeConversionDAO) ClaimForConversion(_ context.Context, _, _ uint64, claimID string) (*ContactInquiry, error) {
	if f.claimErr != nil {
		return nil, f.claimErr
	}
	f.claimID = claimID
	return f.inquiry, nil
}

func (f *fakeConversionDAO) LinkConversion(_ context.Context, _, _ uint64, _ string, prospectID uint64) (*ContactInquiry, error) {
	if f.linkErr != nil {
		return nil, f.linkErr
	}
	f.linkCalled = true
	f.linkedProspectID = prospectID
	entity := *f.inquiry
	entity.ProspectID = &prospectID
	entity.Status = StatusReviewed
	return &entity, nil
}

func (f *fakeConversionDAO) ReleaseConversionClaim(_ context.Context, _, _ uint64, claimID string) error {
	f.releaseCalled = true
	f.releaseClaimID = claimID
	return nil
}

func TestContactInquiryServiceConvertClaimsThenLinks(t *testing.T) {
	orgID := uint64(10)
	conversion := &fakeConversionDAO{
		inquiry: &ContactInquiry{
			Base:           model.Base{ID: 5},
			OrganizationID: &orgID,
			Name:           "Ada",
			Email:          "ada@example.com",
			Message:        "Need CRM",
		},
	}
	svc := NewContactInquiryService(conversion).WithLeadCreator(&fakeLeadCreator{})

	updated, lead, err := svc.Convert(context.Background(), 5, orgID, ConvertInput{OrganizationID: orgID})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if conversion.claimID == "" {
		t.Fatal("expected a conversion claim id")
	}
	if !conversion.linkCalled || conversion.linkedProspectID != 42 {
		t.Fatalf("link = called %v prospect %d, want 42", conversion.linkCalled, conversion.linkedProspectID)
	}
	if conversion.releaseCalled {
		t.Fatal("claim should not be released after a successful link")
	}
	if lead.ID != 42 || updated.ProspectID == nil || *updated.ProspectID != 42 {
		t.Fatalf("lead = %+v, updated = %+v", lead, updated)
	}
	if updated.Status != StatusReviewed {
		t.Errorf("status = %q, want reviewed", updated.Status)
	}
}

func TestContactInquiryServiceConvertReleasesClaimWhenLeadCreationFails(t *testing.T) {
	orgID := uint64(10)
	conversion := &fakeConversionDAO{
		inquiry: &ContactInquiry{
			Base:           model.Base{ID: 5},
			OrganizationID: &orgID,
			Name:           "Ada",
			Email:          "ada@example.com",
			Message:        "Need CRM",
		},
	}
	svc := NewContactInquiryService(conversion).WithLeadCreator(&fakeLeadCreator{err: crm.ErrDuplicateLead})

	_, _, err := svc.Convert(context.Background(), 5, orgID, ConvertInput{OrganizationID: orgID})
	if !errors.Is(err, crm.ErrDuplicateLead) {
		t.Fatalf("err = %v, want %v", err, crm.ErrDuplicateLead)
	}
	if !conversion.releaseCalled || conversion.releaseClaimID != conversion.claimID {
		t.Fatalf("release = %v with claim %q, want claim %q", conversion.releaseCalled, conversion.releaseClaimID, conversion.claimID)
	}
	if conversion.linkCalled {
		t.Fatal("link should not be called when lead creation fails")
	}
}

func TestContactInquiryServiceConvertReleasesClaimWhenLinkFails(t *testing.T) {
	orgID := uint64(10)
	conversion := &fakeConversionDAO{
		inquiry: &ContactInquiry{
			Base:           model.Base{ID: 5},
			OrganizationID: &orgID,
			Name:           "Ada",
			Email:          "ada@example.com",
			Message:        "Need CRM",
		},
		linkErr: errors.New("link failed"),
	}
	svc := NewContactInquiryService(conversion).WithLeadCreator(&fakeLeadCreator{})

	_, _, err := svc.Convert(context.Background(), 5, orgID, ConvertInput{OrganizationID: orgID})
	if err == nil || err.Error() != "link failed" {
		t.Fatalf("err = %v, want link failed", err)
	}
	if !conversion.releaseCalled {
		t.Fatal("claim should be released when linking fails")
	}
}

func TestContactInquiryServiceConvertRejectsClaimConflict(t *testing.T) {
	orgID := uint64(10)
	conversion := &fakeConversionDAO{
		inquiry:  &ContactInquiry{Base: model.Base{ID: 5}, OrganizationID: &orgID},
		claimErr: ErrConversionInProgress,
	}
	leads := &fakeLeadCreator{}
	svc := NewContactInquiryService(conversion).WithLeadCreator(leads)

	_, _, err := svc.Convert(context.Background(), 5, orgID, ConvertInput{OrganizationID: orgID})
	if !errors.Is(err, ErrConversionInProgress) {
		t.Fatalf("err = %v, want %v", err, ErrConversionInProgress)
	}
	if leads.created != nil {
		t.Fatal("lead should not be created when the inquiry is already claimed")
	}
}

func TestContactInquiryServiceFindInOrgRejectsAnotherTenant(t *testing.T) {
	otherOrgID := uint64(20)
	svc := NewContactInquiryService(dao.CRUDMock[ContactInquiry]{
		FindFunc: func(_ context.Context, _ uint64) (*ContactInquiry, error) {
			return &ContactInquiry{Base: model.Base{ID: 5}, OrganizationID: &otherOrgID}, nil
		},
	})

	_, err := svc.FindInOrg(context.Background(), 5, 10)
	if !errors.Is(err, ErrInquiryNotFound) {
		t.Fatalf("err = %v, want %v", err, ErrInquiryNotFound)
	}
}
