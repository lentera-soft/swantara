package handler

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/crm"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type PipelineStageLister interface {
	List(ctx context.Context, q *query.Query) (*query.Page[reference.PipelineStage], error)
	ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[reference.PipelineStage], error)
}

type ProspectResponse struct {
	ID                uint64     `json:"id"`
	OrganizationID    *uint64    `json:"organization_id"`
	Name              string     `json:"name"`
	Type              string     `json:"type"`
	Status            string     `json:"status"`
	Temperature       string     `json:"temperature"`
	ContactID         *uint64    `json:"contact_id"`
	ContactName       *string    `json:"contact_name"`
	Email             *string    `json:"email"`
	Phone             *string    `json:"phone"`
	JobPosition       *string    `json:"job_position"`
	NeedSummary       *string    `json:"need_summary"`
	StageID           *uint64    `json:"stage_id"`
	StageName         *string    `json:"stage_name,omitempty"`
	ExpectedRevenue   float64    `json:"expected_revenue"`
	CurrencyCode      string     `json:"currency_code"`
	Probability       float64    `json:"probability"`
	ForecastCategory  string     `json:"forecast_category"`
	Priority          int16      `json:"priority"`
	SalespersonID     *uint64    `json:"salesperson_id"`
	SalesGroupID      *uint64    `json:"sales_group_id"`
	OwnerUserID       *uint64    `json:"owner_user_id"`
	Source            *string    `json:"source"`
	Medium            *string    `json:"medium"`
	Campaign          *string    `json:"campaign"`
	BudgetAmount      *float64   `json:"budget_amount"`
	BudgetConfirmed   bool       `json:"budget_confirmed"`
	AuthorityConfirm  bool       `json:"authority_confirmed"`
	TimelineDate      *time.Time `json:"timeline_date"`
	FitScore          int16      `json:"fit_score"`
	IntentScore       int16      `json:"intent_score"`
	LeadScore         int16      `json:"lead_score"`
	QualificationNote *string    `json:"qualification_notes"`
	DecisionCriteria  *string    `json:"decision_criteria"`
	Competition       *string    `json:"competition"`
	ProposedSolution  *string    `json:"proposed_solution"`
	NextStep          *string    `json:"next_step"`
	NextStepDue       *time.Time `json:"next_step_due"`
	ConsentGranted    bool       `json:"consent_granted"`
	ConsentSource     *string    `json:"consent_source"`
	ConsentAt         *time.Time `json:"consent_at"`
	DoNotContact      bool       `json:"do_not_contact"`
	FirstContactedAt  *time.Time `json:"first_contacted_at"`
	QualifiedAt       *time.Time `json:"qualified_at"`
	ConvertedAt       *time.Time `json:"converted_at"`
	StageEnteredAt    *time.Time `json:"stage_entered_at"`
	LastActivityAt    *time.Time `json:"last_activity_at"`
	LostReason        *string    `json:"lost_reason"`
	LostReasonCode    *string    `json:"lost_reason_code"`
	ExpectedClose     *time.Time `json:"expected_close"`
	ClosedAt          *time.Time `json:"closed_at"`
	IsWon             bool       `json:"is_won"`
	IsLost            bool       `json:"is_lost"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

func newProspectResponse(prospect *crm.Prospect, stages map[uint64]*reference.PipelineStage) ProspectResponse {
	response := ProspectResponse{
		ID:                prospect.ID,
		OrganizationID:    prospect.OrganizationID,
		Name:              prospect.Name,
		Type:              prospect.Type,
		Status:            prospect.Status,
		Temperature:       prospect.Temperature,
		ContactID:         prospect.ContactID,
		ContactName:       prospect.ContactName,
		Email:             prospect.Email,
		Phone:             prospect.Phone,
		JobPosition:       prospect.JobPosition,
		NeedSummary:       prospect.NeedSummary,
		StageID:           prospect.StageID,
		ExpectedRevenue:   prospect.ExpectedRevenue,
		CurrencyCode:      prospect.CurrencyCode,
		Probability:       prospect.Probability,
		ForecastCategory:  prospect.ForecastCategory,
		Priority:          prospect.Priority,
		SalespersonID:     prospect.SalespersonID,
		SalesGroupID:      prospect.SalesGroupID,
		OwnerUserID:       prospect.OwnerUserID,
		Source:            prospect.Source,
		Medium:            prospect.Medium,
		Campaign:          prospect.Campaign,
		BudgetAmount:      prospect.BudgetAmount,
		BudgetConfirmed:   prospect.BudgetConfirmed,
		AuthorityConfirm:  prospect.AuthorityConfirm,
		TimelineDate:      prospect.TimelineDate,
		FitScore:          prospect.FitScore,
		IntentScore:       prospect.IntentScore,
		LeadScore:         prospect.LeadScore,
		QualificationNote: prospect.QualificationNote,
		DecisionCriteria:  prospect.DecisionCriteria,
		Competition:       prospect.Competition,
		ProposedSolution:  prospect.ProposedSolution,
		NextStep:          prospect.NextStep,
		NextStepDue:       prospect.NextStepDue,
		ConsentGranted:    prospect.ConsentGranted,
		ConsentSource:     prospect.ConsentSource,
		ConsentAt:         prospect.ConsentAt,
		DoNotContact:      prospect.DoNotContact,
		FirstContactedAt:  prospect.FirstContactedAt,
		QualifiedAt:       prospect.QualifiedAt,
		ConvertedAt:       prospect.ConvertedAt,
		StageEnteredAt:    prospect.StageEnteredAt,
		LastActivityAt:    prospect.LastActivityAt,
		LostReason:        prospect.LostReason,
		LostReasonCode:    prospect.LostReasonCode,
		ExpectedClose:     prospect.ExpectedClose,
		ClosedAt:          prospect.ClosedAt,
		CreatedAt:         prospect.CreatedAt,
		UpdatedAt:         prospect.UpdatedAt,
	}
	if prospect.StageID != nil {
		if stage, ok := stages[*prospect.StageID]; ok {
			response.StageName = &stage.Name
			response.IsWon = stage.IsWon
			response.IsLost = stage.IsLost
		}
	}
	return response
}

func loadStageMap(c fiber.Ctx, stages PipelineStageLister) (map[uint64]*reference.PipelineStage, error) {
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return nil, httpx.ErrMissingOrganizationInContext
	}
	parsedQuery := &query.Query{}
	page, err := stages.ListInOrg(c, parsedQuery, organizationID)
	if err != nil {
		return nil, err
	}
	byID := make(map[uint64]*reference.PipelineStage, len(page.Items))
	for _, stage := range page.Items {
		byID[stage.ID] = stage
	}
	return byID, nil
}
