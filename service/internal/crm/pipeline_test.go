package crm

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/iam"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

func TestPipelineService_Forecast_WeightedPipelineAndWinRate(t *testing.T) {
	ctx := context.Background()
	stages := dao.CRUDMock[reference.PipelineStage]{
		ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[reference.PipelineStage], error) {
			return &query.Page[reference.PipelineStage]{Items: []*reference.PipelineStage{
				{Base: model.Base{ID: 1}, Name: "New", Sequence: 10, Probability: 10},
				{Base: model.Base{ID: 2}, Name: "Qualified", Sequence: 20, Probability: 35},
			}}, nil
		},
	}
	leads := ProspectDAOMock{
		ListOpenFunc: func(_ context.Context, _ *uint64) ([]*Prospect, error) {
			return []*Prospect{
				{StageID: &[]uint64{1}[0], ExpectedRevenue: 1000, Probability: 10},
				{StageID: &[]uint64{2}[0], ExpectedRevenue: 2000, Probability: 35},
			}, nil
		},
		CountWonFunc:  func(_ context.Context, _ *uint64) (int64, error) { return 2, nil },
		CountLostFunc: func(_ context.Context, _ *uint64) (int64, error) { return 1, nil },
	}
	svc := NewPipelineService(leads, stages)

	forecast, err := svc.Forecast(ctx, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if forecast.TotalExpectedRevenue != 3000 {
		t.Errorf("total_expected_revenue = %v, want 3000", forecast.TotalExpectedRevenue)
	}
	if forecast.WeightedPipeline != 800 {
		t.Errorf("weighted_pipeline = %v, want 800", forecast.WeightedPipeline)
	}
	if forecast.WinRate != 66.67 {
		t.Errorf("win_rate = %v, want 66.67", forecast.WinRate)
	}
}

func TestPipelineService_Forecast_EmptyPipelineHasZeroWinRate(t *testing.T) {
	ctx := context.Background()
	stages := dao.CRUDMock[reference.PipelineStage]{
		ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[reference.PipelineStage], error) {
			return &query.Page[reference.PipelineStage]{Items: []*reference.PipelineStage{
				{Base: model.Base{ID: 1}, Name: "New", Sequence: 10, Probability: 10},
			}}, nil
		},
	}
	svc := NewPipelineService(ProspectDAOMock{}, stages)

	forecast, err := svc.Forecast(ctx, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if forecast.WeightedPipeline != 0 {
		t.Errorf("weighted_pipeline = %v, want 0", forecast.WeightedPipeline)
	}
	if forecast.WinRate != 0 {
		t.Errorf("win_rate = %v, want 0", forecast.WinRate)
	}
}

func TestPipelineService_Forecast_GroupsByStageInSequenceOrder(t *testing.T) {
	ctx := context.Background()
	stages := dao.CRUDMock[reference.PipelineStage]{
		ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[reference.PipelineStage], error) {
			return &query.Page[reference.PipelineStage]{Items: []*reference.PipelineStage{
				{Base: model.Base{ID: 1}, Name: "New", Sequence: 10, Probability: 10},
				{Base: model.Base{ID: 2}, Name: "Qualified", Sequence: 20, Probability: 35},
				{Base: model.Base{ID: 3}, Name: "Proposal Sent", Sequence: 30, Probability: 60},
			}}, nil
		},
	}
	leads := ProspectDAOMock{
		ListOpenFunc: func(_ context.Context, _ *uint64) ([]*Prospect, error) {
			return []*Prospect{
				{StageID: &[]uint64{3}[0], ExpectedRevenue: 5000, Probability: 60},
				{StageID: &[]uint64{1}[0], ExpectedRevenue: 1000, Probability: 10},
			}, nil
		},
	}
	svc := NewPipelineService(leads, stages)

	forecast, err := svc.Forecast(ctx, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(forecast.Stages) != 3 {
		t.Fatalf("len(stages) = %d, want 3", len(forecast.Stages))
	}
	if forecast.Stages[0].StageName != "New" || forecast.Stages[0].OpportunityCount != 1 || forecast.Stages[0].WeightedRevenue != 100 {
		t.Errorf("stage[0] = %+v, want New/count 1/weighted 100", forecast.Stages[0])
	}
	if forecast.Stages[1].OpportunityCount != 0 || forecast.Stages[1].WeightedRevenue != 0 {
		t.Errorf("stage[1] = %+v, want empty stage", forecast.Stages[1])
	}
	if forecast.Stages[2].StageName != "Proposal Sent" || forecast.Stages[2].OpportunityCount != 1 || forecast.Stages[2].WeightedRevenue != 3000 {
		t.Errorf("stage[2] = %+v, want Proposal Sent/count 1/weighted 3000", forecast.Stages[2])
	}
}

func TestPipelineService_Forecast_PropagatesStageListError(t *testing.T) {
	ctx := context.Background()
	stages := dao.CRUDMock[reference.PipelineStage]{
		ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[reference.PipelineStage], error) {
			return nil, errors.New("db down")
		},
	}
	svc := NewPipelineService(ProspectDAOMock{}, stages)

	_, err := svc.Forecast(ctx, nil)

	helper.AssertError(t, err, true, nil)
}

func TestPipelineService_Forecast_PropagatesListOpenError(t *testing.T) {
	ctx := context.Background()
	stages := dao.CRUDMock[reference.PipelineStage]{
		ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[reference.PipelineStage], error) {
			return &query.Page[reference.PipelineStage]{Items: []*reference.PipelineStage{}}, nil
		},
	}
	leads := ProspectDAOMock{
		ListOpenFunc: func(_ context.Context, _ *uint64) ([]*Prospect, error) {
			return nil, errors.New("db down")
		},
	}
	svc := NewPipelineService(leads, stages)

	_, err := svc.Forecast(ctx, nil)

	helper.AssertError(t, err, true, nil)
}

func TestPipelineService_Forecast_PropagatesCountWonError(t *testing.T) {
	ctx := context.Background()
	stages := dao.CRUDMock[reference.PipelineStage]{
		ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[reference.PipelineStage], error) {
			return &query.Page[reference.PipelineStage]{Items: []*reference.PipelineStage{}}, nil
		},
	}
	leads := ProspectDAOMock{
		CountWonFunc: func(_ context.Context, _ *uint64) (int64, error) {
			return 0, errors.New("db down")
		},
	}
	svc := NewPipelineService(leads, stages)

	_, err := svc.Forecast(ctx, nil)

	helper.AssertError(t, err, true, nil)
}

func TestPipelineService_Forecast_PropagatesCountLostError(t *testing.T) {
	ctx := context.Background()
	stages := dao.CRUDMock[reference.PipelineStage]{
		ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[reference.PipelineStage], error) {
			return &query.Page[reference.PipelineStage]{Items: []*reference.PipelineStage{}}, nil
		},
	}
	leads := ProspectDAOMock{
		CountLostFunc: func(_ context.Context, _ *uint64) (int64, error) {
			return 0, errors.New("db down")
		},
	}
	svc := NewPipelineService(leads, stages)

	_, err := svc.Forecast(ctx, nil)

	helper.AssertError(t, err, true, nil)
}

func TestPipelineService_Forecast_ScopedToOrganization(t *testing.T) {
	ctx := context.Background()
	orgID := helper.Ptr(uint64(10))
	stages := dao.CRUDMock[reference.PipelineStage]{
		ListFunc: func(_ context.Context, q *query.Query) (*query.Page[reference.PipelineStage], error) {
			if len(q.Filters) != 1 || q.Filters[0].Value != uint64(10) {
				t.Errorf("filters = %+v, want organization_id filter", q.Filters)
			}
			return &query.Page[reference.PipelineStage]{Items: []*reference.PipelineStage{
				{Base: model.Base{ID: 1}, Name: "New", Probability: 10},
			}}, nil
		},
	}
	leads := ProspectDAOMock{
		ListOpenFunc: func(_ context.Context, _ *uint64) ([]*Prospect, error) {
			return []*Prospect{
				{StageID: &[]uint64{1}[0], ExpectedRevenue: 1000, Probability: 10},
			}, nil
		},
	}
	svc := NewPipelineService(leads, stages)

	forecast, err := svc.Forecast(ctx, orgID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if forecast.WeightedPipeline != 100 {
		t.Errorf("weighted_pipeline = %v, want 100", forecast.WeightedPipeline)
	}
}

func TestPipelineService_Forecast_CountsResponseSLABreaches(t *testing.T) {
	ctx := context.Background()
	created := time.Now().Add(-30 * time.Hour)
	stages := dao.CRUDMock[reference.PipelineStage]{
		ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[reference.PipelineStage], error) {
			return &query.Page[reference.PipelineStage]{Items: []*reference.PipelineStage{
				{Base: model.Base{ID: 1}, Name: "New", Sequence: 10, Probability: 10},
			}}, nil
		},
	}
	leads := ProspectDAOMock{
		CRUDMock: dao.CRUDMock[Prospect]{
			ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[Prospect], error) {
				return &query.Page[Prospect]{Items: []*Prospect{
					{Base: model.Base{ID: 1, CreatedAt: created}, Name: "Acme", Type: ProspectKindLead, Status: ProspectStatusNew},
				}}, nil
			},
		},
	}
	svc := NewPipelineService(leads, stages)

	forecast, err := svc.Forecast(ctx, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if forecast.LeadFunnel.ResponseSLABreached != 1 {
		t.Errorf("response_sla_breached = %d, want 1", forecast.LeadFunnel.ResponseSLABreached)
	}
	if forecast.LeadFunnel.ResponseSLAHours != 24 {
		t.Errorf("response_sla_hours = %v, want 24", forecast.LeadFunnel.ResponseSLAHours)
	}
}

func TestPipelineService_Forecast_ComputesLeadToOpportunityCycle(t *testing.T) {
	ctx := context.Background()
	created := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	converted := created.Add(5 * 24 * time.Hour)
	stages := dao.CRUDMock[reference.PipelineStage]{
		ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[reference.PipelineStage], error) {
			return &query.Page[reference.PipelineStage]{Items: []*reference.PipelineStage{
				{Base: model.Base{ID: 1}, Name: "Qualified", Sequence: 10, Probability: 35},
			}}, nil
		},
	}
	leads := ProspectDAOMock{
		CRUDMock: dao.CRUDMock[Prospect]{
			ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[Prospect], error) {
				return &query.Page[Prospect]{Items: []*Prospect{
					{
						Base:        model.Base{ID: 1, CreatedAt: created},
						Name:        "Acme",
						Type:        ProspectKindOpportunity,
						Status:      ProspectStatusConverted,
						ConvertedAt: &converted,
					},
				}}, nil
			},
		},
	}
	svc := NewPipelineService(leads, stages)

	forecast, err := svc.Forecast(ctx, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if forecast.LeadFunnel.AverageLeadToOpportunityDays != 5 {
		t.Errorf(
			"average_lead_to_opportunity_days = %v, want 5",
			forecast.LeadFunnel.AverageLeadToOpportunityDays,
		)
	}
}

func TestPipelineService_Forecast_SeparatesLeadAndOpportunityTotals(t *testing.T) {
	ctx := context.Background()
	source := "web"
	stages := dao.CRUDMock[reference.PipelineStage]{
		ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[reference.PipelineStage], error) {
			return &query.Page[reference.PipelineStage]{Items: []*reference.PipelineStage{
				{Base: model.Base{ID: 1}, Name: "Qualified", Sequence: 10, Probability: 35},
			}}, nil
		},
	}
	leads := ProspectDAOMock{
		CRUDMock: dao.CRUDMock[Prospect]{
			ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[Prospect], error) {
				return &query.Page[Prospect]{Items: []*Prospect{
					{Name: "Lead A", Type: ProspectKindLead, Status: ProspectStatusQualified, Source: &source},
					{Name: "Lead B", Type: ProspectKindLead, Status: ProspectStatusNew, Source: &source},
					{Name: "Opp A", Type: ProspectKindOpportunity, Status: ProspectStatusWon, Source: &source},
				}}, nil
			},
		},
	}
	svc := NewPipelineService(leads, stages)

	forecast, err := svc.Forecast(ctx, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if forecast.LeadFunnel.LeadTotal != 2 || forecast.LeadFunnel.Total != 2 {
		t.Errorf("lead total = %d/%d, want 2", forecast.LeadFunnel.LeadTotal, forecast.LeadFunnel.Total)
	}
	if forecast.LeadFunnel.OpportunityTotal != 1 {
		t.Errorf("opportunity total = %d, want 1", forecast.LeadFunnel.OpportunityTotal)
	}
	if forecast.LeadFunnel.QualificationRate != 50 {
		t.Errorf("qualification rate = %v, want 50", forecast.LeadFunnel.QualificationRate)
	}
	if forecast.LeadFunnel.ConversionRate != 50 {
		t.Errorf("conversion rate = %v, want 50", forecast.LeadFunnel.ConversionRate)
	}
	if len(forecast.Sources) != 1 {
		t.Fatalf("sources = %+v, want one", forecast.Sources)
	}
	if forecast.Sources[0].QualificationRate != 50 {
		t.Errorf("source qualification rate = %v, want 50", forecast.Sources[0].QualificationRate)
	}
}

func TestPipelineService_Forecast_GroupsLostReasonsByCode(t *testing.T) {
	ctx := context.Background()
	code := "price"
	text := "Too expensive"
	stages := dao.CRUDMock[reference.PipelineStage]{
		ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[reference.PipelineStage], error) {
			return &query.Page[reference.PipelineStage]{Items: []*reference.PipelineStage{}}, nil
		},
	}
	leads := ProspectDAOMock{
		CRUDMock: dao.CRUDMock[Prospect]{
			ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[Prospect], error) {
				return &query.Page[Prospect]{Items: []*Prospect{
					{Name: "Opp A", Type: ProspectKindOpportunity, Status: ProspectStatusLost, LostReason: &text, LostReasonCode: &code},
					{Name: "Opp B", Type: ProspectKindOpportunity, Status: ProspectStatusLost, LostReason: &text, LostReasonCode: &code},
				}}, nil
			},
		},
	}
	svc := NewPipelineService(leads, stages)

	forecast, err := svc.Forecast(ctx, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(forecast.LostReasons) != 1 || forecast.LostReasons[0].Code != code || forecast.LostReasons[0].Count != 2 {
		t.Fatalf("lost reasons = %+v, want one %q count 2", forecast.LostReasons, code)
	}
}

func TestPipelineService_Forecast_IncludesOwnerUserAndName(t *testing.T) {
	ctx := context.Background()
	ownerID := uint64(7)
	stages := dao.CRUDMock[reference.PipelineStage]{
		ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[reference.PipelineStage], error) {
			return &query.Page[reference.PipelineStage]{Items: []*reference.PipelineStage{}}, nil
		},
	}
	leads := ProspectDAOMock{
		CRUDMock: dao.CRUDMock[Prospect]{
			ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[Prospect], error) {
				return &query.Page[Prospect]{Items: []*Prospect{
					{Name: "Opp A", Type: ProspectKindOpportunity, Status: ProspectStatusQualified, OwnerUserID: &ownerID},
				}}, nil
			},
		},
	}
	users := &fakeUserLookup{user: &iam.User{FirstName: "Ada", LastName: helper.Ptr("Lovelace")}}
	svc := NewPipelineService(leads, stages).WithUsers(users)

	forecast, err := svc.Forecast(ctx, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(forecast.Owners) != 1 {
		t.Fatalf("owners = %+v, want one", forecast.Owners)
	}
	if forecast.Owners[0].OwnerUserID == nil || *forecast.Owners[0].OwnerUserID != ownerID {
		t.Errorf("owner_user_id = %v, want %d", forecast.Owners[0].OwnerUserID, ownerID)
	}
	if forecast.Owners[0].OwnerName != "Ada Lovelace" {
		t.Errorf("owner_name = %q, want Ada Lovelace", forecast.Owners[0].OwnerName)
	}
}

func TestPipelineService_Breakdowns_GroupsByOwnerSource(t *testing.T) {
	ownerID := uint64(7)
	salespersonID := uint64(8)
	teamID := uint64(9)
	svc := NewPipelineService(ProspectDAOMock{}, dao.CRUDMock[reference.PipelineStage]{})
	prospects := []*Prospect{
		{Name: "Owner", Type: ProspectKindOpportunity, OwnerUserID: &ownerID},
		{Name: "Salesperson", Type: ProspectKindOpportunity, SalespersonID: &salespersonID},
		{Name: "Team", Type: ProspectKindOpportunity, SalesGroupID: &teamID},
		{Name: "Unassigned", Type: ProspectKindOpportunity},
	}

	_, _, owners, _ := svc.breakdowns(context.Background(), prospects, time.Now(), 0)
	keys := make(map[string]bool, len(owners))
	for i := range owners {
		keys[ownerKeyValue(&owners[i])] = true
	}
	for _, want := range []string{"user:7", "salesperson:8", "team:9", "unassigned"} {
		if !keys[want] {
			t.Errorf("owner keys = %+v, want %q", keys, want)
		}
	}
}

func TestPipelineService_Forecast_ComputesStageVelocity(t *testing.T) {
	ctx := context.Background()
	orgID := uint64(10)
	now := time.Date(2026, 3, 10, 0, 0, 0, 0, time.UTC)
	stageOne, stageTwo := uint64(1), uint64(2)
	enteredOne := time.Date(2026, 3, 1, 0, 0, 0, 0, time.UTC)
	enteredTwo := time.Date(2026, 3, 6, 0, 0, 0, 0, time.UTC)
	stages := dao.CRUDMock[reference.PipelineStage]{
		ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[reference.PipelineStage], error) {
			return &query.Page[reference.PipelineStage]{Items: []*reference.PipelineStage{
				{Base: model.Base{ID: 1}, Name: "New", Sequence: 10, Probability: 10},
				{Base: model.Base{ID: 2}, Name: "Qualified", Sequence: 20, Probability: 35},
			}}, nil
		},
	}
	history := &StageHistoryDAOMock{
		ListInOrgFunc: func(_ context.Context, organizationID uint64) ([]*ProspectStageHistory, error) {
			if organizationID != orgID {
				t.Errorf("organization = %d, want %d", organizationID, orgID)
			}
			return []*ProspectStageHistory{
				{Base: model.Base{ID: 1, CreatedAt: enteredOne}, ProspectID: 1, ToStageID: &stageOne},
				{Base: model.Base{ID: 2, CreatedAt: enteredTwo}, ProspectID: 1, ToStageID: &stageTwo},
			}, nil
		},
	}
	svc := NewPipelineService(ProspectDAOMock{}, stages).
		WithStageHistory(history).
		WithClock(func() time.Time { return now })

	forecast, err := svc.Forecast(ctx, &orgID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if forecast.Stages[0].AverageVelocityDays != 5 {
		t.Errorf("stage[0] velocity = %v, want 5", forecast.Stages[0].AverageVelocityDays)
	}
	if forecast.Stages[1].AverageVelocityDays != 4 {
		t.Errorf("stage[1] velocity = %v, want 4", forecast.Stages[1].AverageVelocityDays)
	}
}

type fakeUserLookup struct {
	user *iam.User
	err  error
}

func (f *fakeUserLookup) Find(_ context.Context, _ uint64) (*iam.User, error) {
	return f.user, f.err
}
