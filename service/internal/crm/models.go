package crm

import (
	"time"

	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
)

const (
	ProspectKindLead        = "prospect"
	ProspectKindOpportunity = "opportunity"
)

const (
	ProspectStatusNew          = "new"
	ProspectStatusContacted    = "contacted"
	ProspectStatusQualified    = "qualified"
	ProspectStatusNurtured     = "nurtured"
	ProspectStatusDisqualified = "disqualified"
	ProspectStatusConverted    = "converted"
	ProspectStatusWon          = "won"
	ProspectStatusLost         = "lost"
)

const (
	ProspectTemperatureCold     = "cold"
	ProspectTemperatureWarm     = "warm"
	ProspectTemperatureHot      = "hot"
	ProspectTemperatureReferral = "referral"
	ProspectTemperatureExisting = "existing"
)

const (
	ForecastCategoryPipeline = "pipeline"
	ForecastCategoryBestCase = "best_case"
	ForecastCategoryCommit   = "commit"
)

const (
	ProspectContactRoleUser          = "user"
	ProspectContactRoleTechnical     = "technical"
	ProspectContactRoleEconomicBuyer = "economic_buyer"
	ProspectContactRoleChampion      = "champion"
	ProspectContactRoleBlocker       = "blocker"
	ProspectContactRoleInfluencer    = "influencer"
	ProspectContactRoleOther         = "other"
)

const (
	ProspectActivityTypeCall    = "call"
	ProspectActivityTypeMeeting = "meeting"
	ProspectActivityTypeEmail   = "email"
	ProspectActivityTypeNote    = "note"
	ProspectActivityTypeTask    = "task"
)

const (
	ActivityOutcomeConnected     = "connected"
	ActivityOutcomeNoAnswer      = "no_answer"
	ActivityOutcomeLeftMessage   = "left_message"
	ActivityOutcomeMeetingHeld   = "meeting_held"
	ActivityOutcomeDemoDone      = "demo_done"
	ActivityOutcomeProposalSent  = "proposal_sent"
	ActivityOutcomeFollowUp      = "follow_up"
	ActivityOutcomeNotInterested = "not_interested"
	ActivityOutcomeOther         = "other"
)

type Prospect struct {
	model.Base
	OrganizationID    *uint64    `json:"organization_id"`
	Name              string     `gorm:"not null" json:"name"`
	Type              string     `gorm:"type:text" json:"type"`
	Status            string     `gorm:"type:text;default:new" json:"status"`
	Temperature       string     `gorm:"type:text;default:warm" json:"temperature"`
	ContactID         *uint64    `json:"contact_id"`
	ContactName       *string    `json:"contact_name"`
	Email             *string    `json:"email" audit:"redact"`
	Phone             *string    `json:"phone" audit:"redact"`
	JobPosition       *string    `json:"job_position"`
	NeedSummary       *string    `json:"need_summary"`
	StageID           *uint64    `json:"stage_id"`
	ExpectedRevenue   float64    `gorm:"type:numeric(18,4)" json:"expected_revenue"`
	CurrencyCode      string     `gorm:"type:text;default:IDR" json:"currency_code"`
	Probability       float64    `gorm:"type:numeric(5,2)" json:"probability"`
	ForecastCategory  string     `gorm:"type:text;default:pipeline" json:"forecast_category"`
	Priority          int16      `gorm:"default:0" json:"priority"`
	SalespersonID     *uint64    `json:"salesperson_id"`
	SalesGroupID      *uint64    `json:"sales_group_id"`
	OwnerUserID       *uint64    `json:"owner_user_id"`
	Source            *string    `json:"source"`
	Medium            *string    `json:"medium"`
	Campaign          *string    `json:"campaign"`
	BudgetAmount      *float64   `gorm:"type:numeric(18,4)" json:"budget_amount"`
	BudgetConfirmed   bool       `json:"budget_confirmed"`
	AuthorityConfirm  bool       `gorm:"column:authority_confirmed" json:"authority_confirmed"`
	TimelineDate      *time.Time `gorm:"type:date" json:"timeline_date"`
	FitScore          int16      `json:"fit_score"`
	IntentScore       int16      `json:"intent_score"`
	LeadScore         int16      `json:"lead_score"`
	QualificationNote *string    `gorm:"column:qualification_notes" json:"qualification_notes"`
	DecisionCriteria  *string    `json:"decision_criteria"`
	Competition       *string    `json:"competition"`
	ProposedSolution  *string    `json:"proposed_solution"`
	NextStep          *string    `json:"next_step"`
	NextStepDue       *time.Time `gorm:"type:date" json:"next_step_due"`
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
	ExpectedClose     *time.Time `gorm:"type:date" json:"expected_close"`
	ClosedAt          *time.Time `json:"closed_at"`
	AllowDuplicate    bool       `gorm:"-" json:"allow_duplicate,omitempty"`
	AllowUnqualified  bool       `gorm:"-" json:"allow_unqualified,omitempty"`
}

func (Prospect) TableName() string {
	return "prospects"
}

type ProspectContact struct {
	model.Base
	ProspectID uint64 `json:"prospect_id"`
	ContactID  uint64 `json:"contact_id"`
	Role       string `gorm:"type:text;default:influencer" json:"role"`
	IsPrimary  bool   `json:"is_primary"`
}

func (ProspectContact) TableName() string {
	return "prospect_contacts"
}

type ProspectStageHistory struct {
	model.Base
	ProspectID  uint64  `json:"prospect_id"`
	FromStageID *uint64 `json:"from_stage_id"`
	ToStageID   *uint64 `json:"to_stage_id"`
	FromStatus  *string `json:"from_status"`
	ToStatus    *string `json:"to_status"`
	Probability float64 `gorm:"type:numeric(5,2)" json:"probability"`
	Notes       *string `json:"notes"`
	ActorID     *uint64 `json:"actor_id"`
}

func (ProspectStageHistory) TableName() string {
	return "prospect_stage_histories"
}

type ProspectActivity struct {
	model.Base
	ProspectID   *uint64    `gorm:"column:lead_id" json:"lead_id"`
	ContactID    *uint64    `json:"contact_id"`
	Type         string     `gorm:"type:text" json:"type"`
	Summary      string     `gorm:"type:text" json:"summary"`
	Note         *string    `json:"note"`
	Outcome      *string    `json:"outcome"`
	NextStep     *string    `json:"next_step"`
	NextStepDue  *time.Time `gorm:"type:date" json:"next_step_due"`
	Participants *string    `json:"participants"`
	DueDate      *time.Time `json:"due_date"`
	Done         bool       `gorm:"default:false" json:"done"`
	DoneAt       *time.Time `json:"done_at"`
	UserID       *uint64    `json:"user_id"`

	AllowConsentOverride  bool    `gorm:"-" json:"allow_consent_override,omitempty"`
	ConsentOverrideReason *string `gorm:"-" json:"consent_override_reason,omitempty"`
}

func (ProspectActivity) TableName() string {
	return "prospect_activities"
}
