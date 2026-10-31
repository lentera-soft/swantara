package crm

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/contacts"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/iam"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

func TestProspectService_CreateLead_RejectsInvalidInput(t *testing.T) {
	ctx := context.Background()
	svc := NewProspectService(ProspectDAOMock{}, dao.CRUDMock[reference.PipelineStage]{}, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	tests := []struct {
		name     string
		prospect *Prospect
		wantErr  error
	}{
		{name: "empty name", prospect: &Prospect{Name: "  "}, wantErr: ErrLeadNameRequired},
		{name: "invalid type", prospect: &Prospect{Name: "Acme", Type: "vip"}, wantErr: ErrInvalidLeadType},
		{name: "probability out of range", prospect: &Prospect{Name: "Acme", Type: ProspectKindLead, Probability: 120}, wantErr: ErrInvalidProbability},
		{name: "negative revenue", prospect: &Prospect{Name: "Acme", ExpectedRevenue: -5}, wantErr: ErrInvalidRevenue},
		{name: "unknown contact", prospect: &Prospect{Name: "Acme", ContactID: helper.Ptr(uint64(99))}, wantErr: ErrContactNotFound},
		{name: "unknown salesperson", prospect: &Prospect{Name: "Acme", SalespersonID: helper.Ptr(uint64(7))}, wantErr: ErrSalespersonNotFound},
		{name: "unknown sales team", prospect: &Prospect{Name: "Acme", SalesGroupID: helper.Ptr(uint64(3))}, wantErr: ErrSalesGroupNotFound},
		{name: "unknown stage", prospect: &Prospect{Name: "Acme", StageID: helper.Ptr(uint64(9))}, wantErr: ErrStageNotFound},
		{name: "opportunity without stage", prospect: &Prospect{Name: "Acme", Type: ProspectKindOpportunity}, wantErr: ErrStageRequired},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := svc.CreateLead(ctx, tt.prospect)

			helper.AssertError(t, err, true, tt.wantErr)
		})
	}
}

func TestProspectService_CreateLead_DefaultsTypeAndSyncsProbability(t *testing.T) {
	ctx := context.Background()
	stages := dao.CRUDMock[reference.PipelineStage]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.PipelineStage, error) {
			return &reference.PipelineStage{Base: model.Base{ID: 2}, Probability: 35}, nil
		},
	}
	svc := NewProspectService(ProspectDAOMock{}, stages, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	created, err := svc.CreateLead(ctx, &Prospect{Name: "Acme", StageID: helper.Ptr(uint64(2)), Probability: 5})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if created.Type != ProspectKindLead {
		t.Errorf("type = %q, want %q", created.Type, ProspectKindLead)
	}
	if created.Probability != 35 {
		t.Errorf("probability = %v, want 35", created.Probability)
	}
}

func TestProspectService_Promote_RejectsInvalidInput(t *testing.T) {
	ctx := context.Background()

	tests := []struct {
		name    string
		leads   ProspectDAOMock
		stages  dao.CRUDMock[reference.PipelineStage]
		input   PromotionInput
		wantErr error
	}{
		{
			name:    "missing prospect",
			input:   PromotionInput{StageID: 3},
			wantErr: ErrLeadNotFound,
		},
		{
			name:    "non prospect",
			leads:   foundLead(&Prospect{Base: model.Base{ID: 1}, Type: ProspectKindOpportunity, StageID: helper.Ptr(uint64(3))}),
			input:   PromotionInput{StageID: 3},
			wantErr: ErrNotLead,
		},
		{
			name:    "unknown stage",
			leads:   foundLead(&Prospect{Base: model.Base{ID: 1}, Type: ProspectKindLead}),
			input:   PromotionInput{StageID: 3, AllowUnqualified: true},
			wantErr: ErrStageNotFound,
		},
		{
			name:  "negative revenue",
			leads: foundLead(&Prospect{Base: model.Base{ID: 1}, Type: ProspectKindLead}),
			stages: dao.CRUDMock[reference.PipelineStage]{
				FindFunc: func(_ context.Context, _ uint64) (*reference.PipelineStage, error) {
					return &reference.PipelineStage{Base: model.Base{ID: 3}}, nil
				},
			},
			input:   PromotionInput{StageID: 3, ExpectedRevenue: -1, AllowUnqualified: true},
			wantErr: ErrInvalidRevenue,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := NewProspectService(tt.leads, tt.stages, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

			_, err := svc.Promote(ctx, 1, tt.input)

			helper.AssertError(t, err, true, tt.wantErr)
		})
	}
}

func TestProspectService_Promote_ConvertsLeadAndAssignsFields(t *testing.T) {
	ctx := context.Background()
	leads := foundLead(&Prospect{Base: model.Base{ID: 1}, Name: "Acme", Type: ProspectKindLead, ContactName: helper.Ptr("Jane"), NeedSummary: helper.Ptr("Needs CRM")})
	stages := dao.CRUDMock[reference.PipelineStage]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.PipelineStage, error) {
			return &reference.PipelineStage{Base: model.Base{ID: 3}, Probability: 60}, nil
		},
	}
	contactMocks := contacts.ContactDAOMock{
		CRUDMock: dao.CRUDMock[contacts.Contact]{
			FindFunc: func(_ context.Context, id uint64) (*contacts.Contact, error) {
				return &contacts.Contact{Base: model.Base{ID: id}}, nil
			},
		},
	}
	teams := dao.CRUDMock[reference.SalesGroup]{
		FindFunc: func(_ context.Context, id uint64) (*reference.SalesGroup, error) {
			return &reference.SalesGroup{Base: model.Base{ID: id}}, nil
		},
	}
	svc := NewProspectService(leads, stages, teams, contactMocks)

	promoted, err := svc.Promote(ctx, 1, PromotionInput{
		StageID:         3,
		SalespersonID:   helper.Ptr(uint64(11)),
		SalesGroupID:    helper.Ptr(uint64(12)),
		ExpectedRevenue: 1000,
		Priority:        1,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if promoted.Type != ProspectKindOpportunity {
		t.Errorf("type = %q, want opportunity", promoted.Type)
	}
	if promoted.StageID == nil || *promoted.StageID != 3 {
		t.Errorf("stage_id = %v, want 3", promoted.StageID)
	}
	if promoted.Probability != 60 {
		t.Errorf("probability = %v, want 60", promoted.Probability)
	}
	if promoted.SalespersonID == nil || *promoted.SalespersonID != 11 {
		t.Errorf("salesperson_id = %v, want 11", promoted.SalespersonID)
	}
	if promoted.ExpectedRevenue != 1000 {
		t.Errorf("expected_revenue = %v, want 1000", promoted.ExpectedRevenue)
	}
}

func TestProspectService_Promote_UsesProvidedProbability(t *testing.T) {
	ctx := context.Background()
	leads := foundLead(&Prospect{Base: model.Base{ID: 1}, Name: "Acme", Type: ProspectKindLead, ContactName: helper.Ptr("Jane"), NeedSummary: helper.Ptr("Needs CRM")})
	stages := dao.CRUDMock[reference.PipelineStage]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.PipelineStage, error) {
			return &reference.PipelineStage{Base: model.Base{ID: 3}, Probability: 60}, nil
		},
	}
	svc := NewProspectService(leads, stages, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	promoted, err := svc.Promote(ctx, 1, PromotionInput{StageID: 3, Probability: helper.Ptr(float64(45))})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if promoted.Probability != 45 {
		t.Errorf("probability = %v, want 45", promoted.Probability)
	}
}

func TestProspectService_AdvanceStage_RejectsInvalidInput(t *testing.T) {
	ctx := context.Background()
	now := time.Now()

	tests := []struct {
		name    string
		leads   ProspectDAOMock
		stages  dao.CRUDMock[reference.PipelineStage]
		wantErr error
	}{
		{
			name: "closed prospect",
			leads: foundLead(&Prospect{
				Base:     model.Base{ID: 1},
				Type:     ProspectKindOpportunity,
				StageID:  helper.Ptr(uint64(3)),
				ClosedAt: &now,
			}),
			wantErr: ErrLeadClosed,
		},
		{
			name:    "non opportunity",
			leads:   foundLead(&Prospect{Base: model.Base{ID: 1}, Type: ProspectKindLead}),
			wantErr: ErrNotOpportunity,
		},
		{
			name:    "unknown stage",
			leads:   foundLead(&Prospect{Base: model.Base{ID: 1}, Type: ProspectKindOpportunity, StageID: helper.Ptr(uint64(3))}),
			wantErr: ErrStageNotFound,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := NewProspectService(tt.leads, tt.stages, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

			_, err := svc.AdvanceStage(ctx, 1, 4)

			helper.AssertError(t, err, true, tt.wantErr)
		})
	}
}

func TestProspectService_AdvanceStage_SyncsProbability(t *testing.T) {
	ctx := context.Background()
	leads := foundLead(&Prospect{Base: model.Base{ID: 1}, Type: ProspectKindOpportunity, StageID: helper.Ptr(uint64(3))})
	stages := dao.CRUDMock[reference.PipelineStage]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.PipelineStage, error) {
			return &reference.PipelineStage{Base: model.Base{ID: 4}, Probability: 80}, nil
		},
	}
	svc := NewProspectService(leads, stages, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	advanced, err := svc.AdvanceStage(ctx, 1, 4)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if advanced.StageID == nil || *advanced.StageID != 4 {
		t.Errorf("stage_id = %v, want 4", advanced.StageID)
	}
	if advanced.Probability != 80 {
		t.Errorf("probability = %v, want 80", advanced.Probability)
	}
	if advanced.ClosedAt != nil {
		t.Errorf("closed_at = %v, want nil", advanced.ClosedAt)
	}
}

func TestProspectService_AdvanceStage_WonStageClosesLead(t *testing.T) {
	ctx := context.Background()
	leads := foundLead(&Prospect{Base: model.Base{ID: 1}, Type: ProspectKindOpportunity, StageID: helper.Ptr(uint64(3))})
	stages := dao.CRUDMock[reference.PipelineStage]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.PipelineStage, error) {
			return &reference.PipelineStage{Base: model.Base{ID: 4}, Probability: 100, IsWon: true}, nil
		},
	}
	svc := NewProspectService(leads, stages, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	advanced, err := svc.AdvanceStage(ctx, 1, 4)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if advanced.ClosedAt == nil {
		t.Error("closed_at = nil, want set for won stage")
	}
}

func TestProspectService_Win_RejectsInvalidInput(t *testing.T) {
	ctx := context.Background()

	tests := []struct {
		name    string
		leads   ProspectDAOMock
		stages  dao.CRUDMock[reference.PipelineStage]
		wantErr error
	}{
		{
			name:    "no won stage",
			leads:   foundLead(&Prospect{Base: model.Base{ID: 1}, Type: ProspectKindOpportunity, StageID: helper.Ptr(uint64(3))}),
			wantErr: ErrNoWonStage,
		},
		{
			name:    "non opportunity",
			leads:   foundLead(&Prospect{Base: model.Base{ID: 1}, Type: ProspectKindLead}),
			wantErr: ErrNotOpportunity,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := NewProspectService(tt.leads, tt.stages, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

			_, err := svc.Win(ctx, 1)

			helper.AssertError(t, err, true, tt.wantErr)
		})
	}
}

func TestProspectService_Win_MarksWonAndCloses(t *testing.T) {
	ctx := context.Background()
	leads := foundLead(&Prospect{Base: model.Base{ID: 1}, Type: ProspectKindOpportunity, StageID: helper.Ptr(uint64(3))})
	stages := dao.CRUDMock[reference.PipelineStage]{
		ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[reference.PipelineStage], error) {
			return &query.Page[reference.PipelineStage]{Items: []*reference.PipelineStage{
				{Base: model.Base{ID: 4}, Name: "Won", Probability: 100, IsWon: true},
			}}, nil
		},
	}
	svc := NewProspectService(leads, stages, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	won, err := svc.Win(ctx, 1)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if won.StageID == nil || *won.StageID != 4 {
		t.Errorf("stage_id = %v, want 4", won.StageID)
	}
	if won.Probability != 100 {
		t.Errorf("probability = %v, want 100", won.Probability)
	}
	if won.ClosedAt == nil {
		t.Error("closed_at = nil, want set")
	}
}

func TestProspectService_Lose_RejectsInvalidInput(t *testing.T) {
	ctx := context.Background()
	now := time.Now()

	tests := []struct {
		name       string
		leads      ProspectDAOMock
		lostReason string
		wantErr    error
	}{
		{
			name:       "missing lost reason",
			leads:      foundLead(&Prospect{Base: model.Base{ID: 1}, Type: ProspectKindOpportunity, StageID: helper.Ptr(uint64(3))}),
			lostReason: "  ",
			wantErr:    ErrLostReasonRequired,
		},
		{
			name: "closed prospect",
			leads: foundLead(&Prospect{
				Base:     model.Base{ID: 1},
				Type:     ProspectKindOpportunity,
				StageID:  helper.Ptr(uint64(3)),
				ClosedAt: &now,
			}),
			lostReason: "Price too high",
			wantErr:    ErrLeadClosed,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := NewProspectService(tt.leads, dao.CRUDMock[reference.PipelineStage]{}, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

			_, err := svc.Lose(ctx, 1, tt.lostReason)

			helper.AssertError(t, err, true, tt.wantErr)
		})
	}
}

func TestProspectService_Lose_SetsLostReasonAndCloses(t *testing.T) {
	ctx := context.Background()
	leads := foundLead(&Prospect{Base: model.Base{ID: 1}, Type: ProspectKindOpportunity, StageID: helper.Ptr(uint64(3))})
	svc := NewProspectService(leads, dao.CRUDMock[reference.PipelineStage]{}, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	lost, err := svc.Lose(ctx, 1, "Price too high")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if lost.LostReason == nil || *lost.LostReason != "Price too high" {
		t.Errorf("lost_reason = %v, want set", lost.LostReason)
	}
	if lost.Probability != 0 {
		t.Errorf("probability = %v, want 0", lost.Probability)
	}
	if lost.ClosedAt == nil {
		t.Error("closed_at = nil, want set")
	}
}

func TestProspectService_UpdateLead_RejectsMissingStage(t *testing.T) {
	ctx := context.Background()
	svc := NewProspectService(ProspectDAOMock{}, dao.CRUDMock[reference.PipelineStage]{}, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	_, err := svc.UpdateLead(ctx, &Prospect{Base: model.Base{ID: 1}, Name: "Acme", Type: ProspectKindOpportunity})
	if helper.AssertError(t, err, true, ErrStageRequired) {
		return
	}
}

func TestProspectService_UpdateLead_RejectsEmptyName(t *testing.T) {
	ctx := context.Background()
	svc := NewProspectService(ProspectDAOMock{}, dao.CRUDMock[reference.PipelineStage]{}, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	_, err := svc.UpdateLead(ctx, &Prospect{Base: model.Base{ID: 1}, Name: "  "})

	helper.AssertError(t, err, true, ErrLeadNameRequired)
}

func TestProspectService_Promote_PropagatesFindError(t *testing.T) {
	ctx := context.Background()
	leads := ProspectDAOMock{
		CRUDMock: dao.CRUDMock[Prospect]{
			FindFunc: func(_ context.Context, _ uint64) (*Prospect, error) {
				return nil, errors.New("db down")
			},
		},
	}
	svc := NewProspectService(leads, dao.CRUDMock[reference.PipelineStage]{}, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	_, err := svc.Promote(ctx, 1, PromotionInput{StageID: 3})

	helper.AssertError(t, err, true, nil)
}

func TestProspectService_Win_RejectsMissingLead(t *testing.T) {
	ctx := context.Background()
	leads := ProspectDAOMock{
		CRUDMock: dao.CRUDMock[Prospect]{
			FindFunc: func(_ context.Context, _ uint64) (*Prospect, error) {
				return nil, nil
			},
		},
	}
	svc := NewProspectService(leads, dao.CRUDMock[reference.PipelineStage]{}, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	_, err := svc.Win(ctx, 1)

	helper.AssertError(t, err, true, ErrLeadNotFound)
}

func TestProspectService_CreateLead_RejectsNegativePriority(t *testing.T) {
	ctx := context.Background()
	svc := NewProspectService(ProspectDAOMock{}, dao.CRUDMock[reference.PipelineStage]{}, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	_, err := svc.CreateLead(ctx, &Prospect{Name: "Acme", Priority: -1})

	helper.AssertError(t, err, true, ErrInvalidPriority)
}

func TestProspectService_AdvanceStage_RejectsStageFromAnotherOrganization(t *testing.T) {
	ctx := context.Background()
	leads := foundLead(&Prospect{Base: model.Base{ID: 1}, OrganizationID: helper.Ptr(uint64(10)), Type: ProspectKindOpportunity, StageID: helper.Ptr(uint64(3))})
	stages := dao.CRUDMock[reference.PipelineStage]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.PipelineStage, error) {
			return &reference.PipelineStage{Base: model.Base{ID: 3}, OrganizationID: helper.Ptr(uint64(20))}, nil
		},
	}
	svc := NewProspectService(leads, stages, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	_, err := svc.AdvanceStage(ctx, 1, 3)

	helper.AssertError(t, err, true, ErrStageOrganization)
}

func TestProspectService_UpdateLead_SyncsProbabilityFromStage(t *testing.T) {
	ctx := context.Background()
	leads := dao.CRUDMock[Prospect]{
		UpdateFunc: func(_ context.Context, prospect *Prospect) (*Prospect, error) {
			return prospect, nil
		},
	}
	stages := dao.CRUDMock[reference.PipelineStage]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.PipelineStage, error) {
			return &reference.PipelineStage{Base: model.Base{ID: 2}, Probability: 50}, nil
		},
	}
	svc := NewProspectService(ProspectDAOMock{CRUDMock: leads}, stages, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	updated, err := svc.UpdateLead(ctx, &Prospect{Base: model.Base{ID: 1}, Name: "Acme", Type: ProspectKindOpportunity, StageID: helper.Ptr(uint64(2)), Probability: 5, ContactName: helper.Ptr("Jane"), NeedSummary: helper.Ptr("Needs CRM")})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated.Probability != 50 {
		t.Errorf("probability = %v, want 50", updated.Probability)
	}
}

func TestProspectService_UpdateLead_KeepsProbabilityWithoutStage(t *testing.T) {
	ctx := context.Background()
	svc := NewProspectService(ProspectDAOMock{}, dao.CRUDMock[reference.PipelineStage]{}, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	updated, err := svc.UpdateLead(ctx, &Prospect{Base: model.Base{ID: 1}, Name: "Acme", Type: ProspectKindLead, Probability: 20})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated.Probability != 20 {
		t.Errorf("probability = %v, want 20", updated.Probability)
	}
}

func TestProspectService_UpdateLead_RejectsStageFromAnotherOrganization(t *testing.T) {
	ctx := context.Background()
	stages := dao.CRUDMock[reference.PipelineStage]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.PipelineStage, error) {
			return &reference.PipelineStage{Base: model.Base{ID: 2}, OrganizationID: helper.Ptr(uint64(20))}, nil
		},
	}
	svc := NewProspectService(ProspectDAOMock{}, stages, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	_, err := svc.UpdateLead(ctx, &Prospect{Name: "Acme", OrganizationID: helper.Ptr(uint64(10)), Type: ProspectKindOpportunity, StageID: helper.Ptr(uint64(2)), AllowUnqualified: true})

	helper.AssertError(t, err, true, ErrStageOrganization)
}

func TestProspectService_AdvanceStage_PropagatesFindError(t *testing.T) {
	ctx := context.Background()
	leads := ProspectDAOMock{
		CRUDMock: dao.CRUDMock[Prospect]{
			FindFunc: func(_ context.Context, _ uint64) (*Prospect, error) {
				return nil, errors.New("db down")
			},
		},
	}
	svc := NewProspectService(leads, dao.CRUDMock[reference.PipelineStage]{}, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	_, err := svc.AdvanceStage(ctx, 1, 4)

	helper.AssertError(t, err, true, nil)
}

func TestProspectService_Promote_RejectsInvalidProbability(t *testing.T) {
	ctx := context.Background()
	leads := foundLead(&Prospect{Base: model.Base{ID: 1}, Name: "Acme", Type: ProspectKindLead})
	stages := dao.CRUDMock[reference.PipelineStage]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.PipelineStage, error) {
			return &reference.PipelineStage{Base: model.Base{ID: 3}, Probability: 60}, nil
		},
	}
	svc := NewProspectService(leads, stages, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	_, err := svc.Promote(ctx, 1, PromotionInput{StageID: 3, Probability: helper.Ptr(float64(150)), AllowUnqualified: true})

	helper.AssertError(t, err, true, ErrInvalidProbability)
}

func TestProspectService_Promote_RejectsNegativePriority(t *testing.T) {
	ctx := context.Background()
	leads := foundLead(&Prospect{Base: model.Base{ID: 1}, Name: "Acme", Type: ProspectKindLead})
	stages := dao.CRUDMock[reference.PipelineStage]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.PipelineStage, error) {
			return &reference.PipelineStage{Base: model.Base{ID: 3}}, nil
		},
	}
	svc := NewProspectService(leads, stages, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	_, err := svc.Promote(ctx, 1, PromotionInput{StageID: 3, Priority: -1, AllowUnqualified: true})

	helper.AssertError(t, err, true, ErrInvalidPriority)
}

func TestProspectService_Promote_RejectsUnknownSalesperson(t *testing.T) {
	ctx := context.Background()
	leads := foundLead(&Prospect{Base: model.Base{ID: 1}, Name: "Acme", Type: ProspectKindLead})
	stages := dao.CRUDMock[reference.PipelineStage]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.PipelineStage, error) {
			return &reference.PipelineStage{Base: model.Base{ID: 3}}, nil
		},
	}
	svc := NewProspectService(leads, stages, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	_, err := svc.Promote(ctx, 1, PromotionInput{StageID: 3, SalespersonID: helper.Ptr(uint64(11)), AllowUnqualified: true})

	helper.AssertError(t, err, true, ErrSalespersonNotFound)
}

func TestProspectService_Promote_RejectsUnknownSalesGroup(t *testing.T) {
	ctx := context.Background()
	leads := foundLead(&Prospect{Base: model.Base{ID: 1}, Name: "Acme", Type: ProspectKindLead})
	stages := dao.CRUDMock[reference.PipelineStage]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.PipelineStage, error) {
			return &reference.PipelineStage{Base: model.Base{ID: 3}}, nil
		},
	}
	svc := NewProspectService(leads, stages, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	_, err := svc.Promote(ctx, 1, PromotionInput{StageID: 3, SalesGroupID: helper.Ptr(uint64(12)), AllowUnqualified: true})

	helper.AssertError(t, err, true, ErrSalesGroupNotFound)
}

func TestProspectService_CreateLead_PropagatesContactLookupError(t *testing.T) {
	ctx := context.Background()
	contactsMock := contacts.ContactDAOMock{
		CRUDMock: dao.CRUDMock[contacts.Contact]{
			FindFunc: func(_ context.Context, _ uint64) (*contacts.Contact, error) {
				return nil, errors.New("db down")
			},
		},
	}
	svc := NewProspectService(ProspectDAOMock{}, dao.CRUDMock[reference.PipelineStage]{}, dao.CRUDMock[reference.SalesGroup]{}, contactsMock)

	_, err := svc.CreateLead(ctx, &Prospect{Name: "Acme", ContactID: helper.Ptr(uint64(5))})

	helper.AssertError(t, err, true, nil)
}

func TestProspectService_CreateLead_PropagatesSalespersonLookupError(t *testing.T) {
	ctx := context.Background()
	contactsMock := contacts.ContactDAOMock{
		CRUDMock: dao.CRUDMock[contacts.Contact]{
			FindFunc: func(_ context.Context, _ uint64) (*contacts.Contact, error) {
				return nil, errors.New("db down")
			},
		},
	}
	svc := NewProspectService(ProspectDAOMock{}, dao.CRUDMock[reference.PipelineStage]{}, dao.CRUDMock[reference.SalesGroup]{}, contactsMock)

	_, err := svc.CreateLead(ctx, &Prospect{Name: "Acme", SalespersonID: helper.Ptr(uint64(7))})

	helper.AssertError(t, err, true, nil)
}

func TestProspectService_CreateLead_PropagatesSalesGroupLookupError(t *testing.T) {
	ctx := context.Background()
	teams := dao.CRUDMock[reference.SalesGroup]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.SalesGroup, error) {
			return nil, errors.New("db down")
		},
	}
	svc := NewProspectService(ProspectDAOMock{}, dao.CRUDMock[reference.PipelineStage]{}, teams, contacts.ContactDAOMock{})

	_, err := svc.CreateLead(ctx, &Prospect{Name: "Acme", SalesGroupID: helper.Ptr(uint64(3))})

	helper.AssertError(t, err, true, nil)
}

func TestProspectService_CreateLead_PropagatesStageLookupError(t *testing.T) {
	ctx := context.Background()
	stages := dao.CRUDMock[reference.PipelineStage]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.PipelineStage, error) {
			return nil, errors.New("db down")
		},
	}
	svc := NewProspectService(ProspectDAOMock{}, stages, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	_, err := svc.CreateLead(ctx, &Prospect{Name: "Acme", StageID: helper.Ptr(uint64(9))})

	helper.AssertError(t, err, true, nil)
}

func TestProspectService_Win_ScopesWonStageToOrganization(t *testing.T) {
	ctx := context.Background()
	leads := foundLead(&Prospect{Base: model.Base{ID: 1}, OrganizationID: helper.Ptr(uint64(10)), Type: ProspectKindOpportunity, StageID: helper.Ptr(uint64(3))})
	stages := dao.CRUDMock[reference.PipelineStage]{
		ListFunc: func(_ context.Context, q *query.Query) (*query.Page[reference.PipelineStage], error) {
			if len(q.Filters) != 1 || q.Filters[0].Value != uint64(10) {
				t.Errorf("filters = %+v, want organization_id filter", q.Filters)
			}
			return &query.Page[reference.PipelineStage]{Items: []*reference.PipelineStage{
				{Base: model.Base{ID: 4}, Name: "Won", IsWon: true},
			}}, nil
		},
	}
	svc := NewProspectService(leads, stages, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	won, err := svc.Win(ctx, 1)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if won.StageID == nil || *won.StageID != 4 {
		t.Errorf("stage_id = %v, want 4", won.StageID)
	}
}

func TestProspectService_Win_PropagatesStageListError(t *testing.T) {
	ctx := context.Background()
	leads := foundLead(&Prospect{Base: model.Base{ID: 1}, Type: ProspectKindOpportunity, StageID: helper.Ptr(uint64(3))})
	stages := dao.CRUDMock[reference.PipelineStage]{
		ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[reference.PipelineStage], error) {
			return nil, errors.New("db down")
		},
	}
	svc := NewProspectService(leads, stages, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	_, err := svc.Win(ctx, 1)

	helper.AssertError(t, err, true, nil)
}

func foundLead(prospect *Prospect) ProspectDAOMock {
	return ProspectDAOMock{
		CRUDMock: dao.CRUDMock[Prospect]{
			FindFunc: func(_ context.Context, _ uint64) (*Prospect, error) {
				return prospect, nil
			},
		},
	}
}

func TestProspectService_WithClock_ControlsTimestamps(t *testing.T) {
	ctx := context.Background()
	fixed := time.Date(2024, time.March, 1, 12, 0, 0, 0, time.UTC)
	leads := foundLead(&Prospect{Base: model.Base{ID: 1}, Type: ProspectKindOpportunity, StageID: helper.Ptr(uint64(3))})
	stages := dao.CRUDMock[reference.PipelineStage]{
		ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[reference.PipelineStage], error) {
			return &query.Page[reference.PipelineStage]{Items: []*reference.PipelineStage{
				{Base: model.Base{ID: 4}, Name: "Won", Probability: 100, IsWon: true},
			}}, nil
		},
	}
	svc := NewProspectService(leads, stages, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{}).
		WithClock(func() time.Time { return fixed })

	won, err := svc.Win(ctx, 1)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if won.ClosedAt == nil || !won.ClosedAt.Equal(fixed) {
		t.Fatalf("closed_at = %v, want %v", won.ClosedAt, fixed)
	}
}

func TestProspectService_Promote_RequiresContactAndNeed(t *testing.T) {
	ctx := context.Background()
	leads := foundLead(&Prospect{Base: model.Base{ID: 1}, Name: "Acme", Type: ProspectKindLead})
	stages := dao.CRUDMock[reference.PipelineStage]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.PipelineStage, error) {
			return &reference.PipelineStage{Base: model.Base{ID: 3}}, nil
		},
	}
	svc := NewProspectService(leads, stages, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	_, err := svc.Promote(ctx, 1, PromotionInput{StageID: 3})

	helper.AssertError(t, err, true, ErrPromotionRequirementsUnmet)
}

func TestProspectService_Promote_AllowsExplicitOverride(t *testing.T) {
	ctx := context.Background()
	leads := foundLead(&Prospect{Base: model.Base{ID: 1}, Name: "Acme", Type: ProspectKindLead})
	leads.UpdateFunc = func(_ context.Context, prospect *Prospect) (*Prospect, error) {
		return prospect, nil
	}
	stages := dao.CRUDMock[reference.PipelineStage]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.PipelineStage, error) {
			return &reference.PipelineStage{Base: model.Base{ID: 3}}, nil
		},
	}
	svc := NewProspectService(leads, stages, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	promoted, err := svc.Promote(ctx, 1, PromotionInput{StageID: 3, AllowUnqualified: true})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if promoted.Type != ProspectKindOpportunity {
		t.Errorf("type = %q, want opportunity", promoted.Type)
	}
}

func TestProspectService_Promote_RejectsWonTargetStage(t *testing.T) {
	ctx := context.Background()
	leads := foundLead(&Prospect{
		Base:        model.Base{ID: 1},
		Name:        "Acme",
		Type:        ProspectKindLead,
		ContactName: helper.Ptr("Jane"),
		NeedSummary: helper.Ptr("Needs CRM"),
	})
	stages := dao.CRUDMock[reference.PipelineStage]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.PipelineStage, error) {
			return &reference.PipelineStage{Base: model.Base{ID: 3}, IsWon: true}, nil
		},
	}
	svc := NewProspectService(leads, stages, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	_, err := svc.Promote(ctx, 1, PromotionInput{StageID: 3})

	helper.AssertError(t, err, true, ErrInvalidTargetStage)
}

func TestProspectService_UpdateLead_RejectsBypassTransition(t *testing.T) {
	ctx := context.Background()
	leads := foundLead(&Prospect{Base: model.Base{ID: 1}, Name: "Acme", Type: ProspectKindLead, Status: ProspectStatusNew})
	svc := NewProspectService(leads, dao.CRUDMock[reference.PipelineStage]{}, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	_, err := svc.UpdateLead(ctx, &Prospect{Base: model.Base{ID: 1}, Name: "Acme", Type: ProspectKindLead, Status: ProspectStatusQualified})

	helper.AssertError(t, err, true, ErrInvalidStatusTransition)
}

func TestProspectService_UpdateLead_RejectsDisqualifyWithoutReason(t *testing.T) {
	ctx := context.Background()
	leads := foundLead(&Prospect{Base: model.Base{ID: 1}, Name: "Acme", Type: ProspectKindLead, Status: ProspectStatusNew})
	svc := NewProspectService(leads, dao.CRUDMock[reference.PipelineStage]{}, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	_, err := svc.UpdateLead(ctx, &Prospect{Base: model.Base{ID: 1}, Name: "Acme", Type: ProspectKindLead, Status: ProspectStatusDisqualified})

	helper.AssertError(t, err, true, ErrLostReasonRequired)
}

func TestProspectService_ReassignOwnerRecordsAudit(t *testing.T) {
	ctx := context.Background()
	historyEntries := make([]*ProspectStageHistory, 0, 1)
	history := &StageHistoryDAOMock{CreateFunc: func(_ context.Context, entry *ProspectStageHistory) (*ProspectStageHistory, error) {
		historyEntries = append(historyEntries, entry)
		return entry, nil
	}}
	leads := ProspectDAOMock{
		CRUDMock: dao.CRUDMock[Prospect]{
			FindFunc: func(_ context.Context, _ uint64) (*Prospect, error) {
				return &Prospect{Base: model.Base{ID: 1}, OrganizationID: helper.Ptr(uint64(10)), Name: "Acme", Type: ProspectKindLead}, nil
			},
			UpdateFunc: func(_ context.Context, prospect *Prospect) (*Prospect, error) {
				return prospect, nil
			},
		},
	}
	svc := NewProspectService(leads, dao.CRUDMock[reference.PipelineStage]{}, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{}).WithStageHistory(history)

	updated, err := svc.ReassignOwner(ctx, 1, 10, helper.Ptr(uint64(7)))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated.OwnerUserID == nil || *updated.OwnerUserID != 7 {
		t.Errorf("owner = %v, want 7", updated.OwnerUserID)
	}
	if len(historyEntries) != 1 {
		t.Fatalf("history entries = %d, want 1", len(historyEntries))
	}
}

type fakeMemberDirectory struct {
	active bool
	err    error
}

func (f fakeMemberDirectory) IsActiveMember(_ context.Context, _, _ uint64) (bool, error) {
	return f.active, f.err
}

func TestProspectService_RejectsCrossOrganizationReferences(t *testing.T) {
	ctx := context.Background()
	prospectOrg := uint64(10)
	otherOrg := uint64(20)
	newProspect := func() *Prospect {
		return &Prospect{
			Name:           "Acme",
			OrganizationID: &prospectOrg,
			ContactID:      helper.Ptr(uint64(5)),
			SalespersonID:  helper.Ptr(uint64(5)),
			SalesGroupID:   helper.Ptr(uint64(3)),
		}
	}

	tests := []struct {
		name     string
		contacts contacts.ContactDAOMock
		teams    dao.CRUDMock[reference.SalesGroup]
		wantErr  error
	}{
		{
			name: "contact belongs to another organization",
			contacts: contacts.ContactDAOMock{
				CRUDMock: dao.CRUDMock[contacts.Contact]{
					FindFunc: func(_ context.Context, _ uint64) (*contacts.Contact, error) {
						return &contacts.Contact{Base: model.Base{ID: 5}, OrganizationID: &otherOrg}, nil
					},
				},
			},
			wantErr: ErrContactOrganization,
		},
		{
			name: "salesperson belongs to another organization",
			contacts: contacts.ContactDAOMock{
				CRUDMock: dao.CRUDMock[contacts.Contact]{
					FindFunc: func(_ context.Context, id uint64) (*contacts.Contact, error) {
						if id == 5 {
							return &contacts.Contact{Base: model.Base{ID: 5}, OrganizationID: &otherOrg}, nil
						}
						return nil, nil
					},
				},
			},
			teams: dao.CRUDMock[reference.SalesGroup]{
				FindFunc: func(_ context.Context, _ uint64) (*reference.SalesGroup, error) {
					return &reference.SalesGroup{Base: model.Base{ID: 3}, OrganizationID: &prospectOrg}, nil
				},
			},
			wantErr: ErrSalespersonOrganization,
		},
		{
			name: "sales team belongs to another organization",
			contacts: contacts.ContactDAOMock{
				CRUDMock: dao.CRUDMock[contacts.Contact]{
					FindFunc: func(_ context.Context, _ uint64) (*contacts.Contact, error) {
						return &contacts.Contact{Base: model.Base{ID: 5}, OrganizationID: &prospectOrg}, nil
					},
				},
			},
			teams: dao.CRUDMock[reference.SalesGroup]{
				FindFunc: func(_ context.Context, _ uint64) (*reference.SalesGroup, error) {
					return &reference.SalesGroup{Base: model.Base{ID: 3}, OrganizationID: &otherOrg}, nil
				},
			},
			wantErr: ErrSalesGroupOrganization,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			prospect := newProspect()
			if tt.name != "contact belongs to another organization" {
				prospect.ContactID = nil
			}
			svc := NewProspectService(ProspectDAOMock{}, dao.CRUDMock[reference.PipelineStage]{}, tt.teams, tt.contacts)
			_, err := svc.CreateLead(ctx, prospect)
			helper.AssertError(t, err, true, tt.wantErr)
		})
	}
}

func TestProspectService_ReassignOwnerRejectsNonMember(t *testing.T) {
	ctx := context.Background()
	leads := foundLead(&Prospect{Base: model.Base{ID: 1}, OrganizationID: helper.Ptr(uint64(10)), Name: "Acme", Type: ProspectKindLead})
	svc := NewProspectService(leads, dao.CRUDMock[reference.PipelineStage]{}, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{}).
		WithMembers(fakeMemberDirectory{active: false})

	_, err := svc.ReassignOwner(ctx, 1, 10, helper.Ptr(uint64(7)))

	helper.AssertError(t, err, true, ErrOwnerNotMember)
}

func TestProspectService_ReassignOwnersUsesTransactionalDAO(t *testing.T) {
	ctx := context.Background()
	called := false
	leads := foundLead(&Prospect{Base: model.Base{ID: 1}, OrganizationID: helper.Ptr(uint64(10)), Name: "Acme", Type: ProspectKindLead})
	leads.ReassignOwnersFunc = func(_ context.Context, organizationID uint64, ids []uint64, owner *uint64) error {
		called = true
		if organizationID != 10 || len(ids) != 1 || owner == nil || *owner != 7 {
			t.Fatalf("unexpected transactional call: org=%d ids=%v owner=%v", organizationID, ids, owner)
		}
		return nil
	}
	svc := NewProspectService(leads, dao.CRUDMock[reference.PipelineStage]{}, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{}).
		WithMembers(fakeMemberDirectory{active: true})

	updated, err := svc.ReassignOwners(ctx, 10, []uint64{1}, helper.Ptr(uint64(7)))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !called {
		t.Fatal("expected transactional ReassignOwners DAO call")
	}
	if len(updated) != 1 || updated[0].OwnerUserID == nil || *updated[0].OwnerUserID != 7 {
		t.Fatalf("updated = %+v", updated)
	}
}

func TestProspectService_UpdateOpportunityRejectsWonLostStage(t *testing.T) {
	ctx := context.Background()
	leads := foundLead(&Prospect{
		Base:           model.Base{ID: 1},
		OrganizationID: helper.Ptr(uint64(10)),
		Name:           "Acme",
		Type:           ProspectKindOpportunity,
		Status:         ProspectStatusQualified,
		StageID:        helper.Ptr(uint64(2)),
	})
	stages := dao.CRUDMock[reference.PipelineStage]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.PipelineStage, error) {
			return &reference.PipelineStage{Base: model.Base{ID: 3}, OrganizationID: helper.Ptr(uint64(10)), IsWon: true}, nil
		},
	}
	svc := NewProspectService(leads, stages, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	_, err := svc.UpdateLead(ctx, &Prospect{
		Base:             model.Base{ID: 1},
		OrganizationID:   helper.Ptr(uint64(10)),
		Name:             "Acme",
		Type:             ProspectKindOpportunity,
		Status:           ProspectStatusQualified,
		StageID:          helper.Ptr(uint64(3)),
		AllowUnqualified: true,
	})

	helper.AssertError(t, err, true, ErrInvalidTargetStage)
}

func TestProspectService_UpdateOpportunityRejectsDirectWinStatus(t *testing.T) {
	ctx := context.Background()
	leads := foundLead(&Prospect{
		Base:           model.Base{ID: 1},
		OrganizationID: helper.Ptr(uint64(10)),
		Name:           "Acme",
		Type:           ProspectKindOpportunity,
		Status:         ProspectStatusQualified,
		StageID:        helper.Ptr(uint64(2)),
	})
	stages := dao.CRUDMock[reference.PipelineStage]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.PipelineStage, error) {
			return &reference.PipelineStage{Base: model.Base{ID: 2}, OrganizationID: helper.Ptr(uint64(10))}, nil
		},
	}
	svc := NewProspectService(leads, stages, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	_, err := svc.UpdateLead(ctx, &Prospect{
		Base:             model.Base{ID: 1},
		OrganizationID:   helper.Ptr(uint64(10)),
		Name:             "Acme",
		Type:             ProspectKindOpportunity,
		Status:           ProspectStatusWon,
		StageID:          helper.Ptr(uint64(2)),
		AllowUnqualified: true,
	})

	helper.AssertError(t, err, true, ErrInvalidStatusTransition)
}

func TestProspectService_UpdateOpportunityRecordsStageChange(t *testing.T) {
	ctx := context.Background()
	fixed := time.Date(2024, time.March, 1, 12, 0, 0, 0, time.UTC)
	var historyEntries []*ProspectStageHistory
	existing := &Prospect{
		Base:           model.Base{ID: 1},
		OrganizationID: helper.Ptr(uint64(10)),
		Name:           "Acme",
		Type:           ProspectKindOpportunity,
		Status:         ProspectStatusQualified,
		StageID:        helper.Ptr(uint64(2)),
	}
	leads := foundLead(existing)
	leads.UpdateFunc = func(_ context.Context, prospect *Prospect) (*Prospect, error) {
		return prospect, nil
	}
	stages := dao.CRUDMock[reference.PipelineStage]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.PipelineStage, error) {
			return &reference.PipelineStage{Base: model.Base{ID: 3}, OrganizationID: helper.Ptr(uint64(10)), Probability: 50}, nil
		},
	}
	history := &StageHistoryDAOMock{CreateFunc: func(_ context.Context, entry *ProspectStageHistory) (*ProspectStageHistory, error) {
		historyEntries = append(historyEntries, entry)
		return entry, nil
	}}
	svc := NewProspectService(leads, stages, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{}).
		WithStageHistory(history).
		WithClock(func() time.Time { return fixed })

	updated, err := svc.UpdateLead(ctx, &Prospect{
		Base:             model.Base{ID: 1},
		OrganizationID:   helper.Ptr(uint64(10)),
		Name:             "Acme",
		Type:             ProspectKindOpportunity,
		Status:           ProspectStatusQualified,
		StageID:          helper.Ptr(uint64(3)),
		AllowUnqualified: true,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated.StageEnteredAt == nil || !updated.StageEnteredAt.Equal(fixed) {
		t.Fatalf("stage_entered_at = %v, want %v", updated.StageEnteredAt, fixed)
	}
	if len(historyEntries) != 1 {
		t.Fatalf("history entries = %d, want 1", len(historyEntries))
	}
	if historyEntries[0].FromStageID == nil || *historyEntries[0].FromStageID != 2 {
		t.Fatalf("from stage = %v, want 2", historyEntries[0].FromStageID)
	}
	if historyEntries[0].ToStageID == nil || *historyEntries[0].ToStageID != 3 {
		t.Fatalf("to stage = %v, want 3", historyEntries[0].ToStageID)
	}
}

func TestProspectService_Promote_RequiresAuthorizedOverrideRole(t *testing.T) {
	ctx := model.ContextWithActor(context.Background(), 42)
	leads := foundLead(&Prospect{Base: model.Base{ID: 1}, Name: "Acme", Type: ProspectKindLead, OrganizationID: helper.Ptr(uint64(10))})
	stages := dao.CRUDMock[reference.PipelineStage]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.PipelineStage, error) {
			return &reference.PipelineStage{Base: model.Base{ID: 3}}, nil
		},
	}
	permissions := iam.PermissionDAOMock{
		UserHasOrganizationPermissionFunc: func(_ context.Context, _, _ uint64, resource, action string) (bool, error) {
			if resource != "prospect" || action != "override" {
				t.Errorf("permission = %s.%s, want prospect.override", resource, action)
			}
			return false, nil
		},
	}
	svc := NewProspectService(leads, stages, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{}).
		WithPermissions(permissions)

	_, err := svc.Promote(ctx, 1, PromotionInput{StageID: 3, AllowUnqualified: true})

	helper.AssertError(t, err, true, ErrPromotionOverrideForbidden)
}

func TestProspectService_Promote_AllowsOwnerOverride(t *testing.T) {
	ctx := model.ContextWithActor(context.Background(), 42)
	leads := foundLead(&Prospect{Base: model.Base{ID: 1}, Name: "Acme", Type: ProspectKindLead, OrganizationID: helper.Ptr(uint64(10))})
	leads.UpdateFunc = func(_ context.Context, prospect *Prospect) (*Prospect, error) {
		return prospect, nil
	}
	stages := dao.CRUDMock[reference.PipelineStage]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.PipelineStage, error) {
			return &reference.PipelineStage{Base: model.Base{ID: 3}}, nil
		},
	}
	permissions := iam.PermissionDAOMock{
		UserIsOrganizationOwnerFunc: func(_ context.Context, userID, organizationID uint64) (bool, error) {
			if userID != 42 || organizationID != 10 {
				t.Errorf("owner check = %d/%d, want 42/10", userID, organizationID)
			}
			return true, nil
		},
	}
	svc := NewProspectService(leads, stages, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{}).
		WithPermissions(permissions)

	promoted, err := svc.Promote(ctx, 1, PromotionInput{StageID: 3, AllowUnqualified: true})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if promoted.Type != ProspectKindOpportunity {
		t.Errorf("type = %q, want opportunity", promoted.Type)
	}
}

func TestProspectService_Promote_PreservesExistingAssignments(t *testing.T) {
	ctx := context.Background()
	leads := foundLead(&Prospect{
		Base:          model.Base{ID: 1},
		Name:          "Acme",
		Type:          ProspectKindLead,
		SalespersonID: helper.Ptr(uint64(7)),
		SalesGroupID:  helper.Ptr(uint64(9)),
	})
	leads.UpdateFunc = func(_ context.Context, prospect *Prospect) (*Prospect, error) {
		return prospect, nil
	}
	stages := dao.CRUDMock[reference.PipelineStage]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.PipelineStage, error) {
			return &reference.PipelineStage{Base: model.Base{ID: 3}}, nil
		},
	}
	svc := NewProspectService(leads, stages, dao.CRUDMock[reference.SalesGroup]{}, contacts.ContactDAOMock{})

	promoted, err := svc.Promote(ctx, 1, PromotionInput{StageID: 3, AllowUnqualified: true})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if promoted.SalespersonID == nil || *promoted.SalespersonID != 7 {
		t.Errorf("salesperson = %v, want 7", promoted.SalespersonID)
	}
	if promoted.SalesGroupID == nil || *promoted.SalesGroupID != 9 {
		t.Errorf("sales group = %v, want 9", promoted.SalesGroupID)
	}
}
