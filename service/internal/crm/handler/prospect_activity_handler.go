package handler

import (
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/crm"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

type ProspectActivityHandler struct {
	svc crm.ProspectActivityService
}

func NewProspectActivityHandler(svc crm.ProspectActivityService) ProspectActivityHandler {
	return ProspectActivityHandler{svc: svc}
}

var prospectActivityQueryAllowlist = map[string]struct{}{
	"prospect_id": {},
	"contact_id":  {},
	"type":        {},
	"summary":     {},
	"due_date":    {},
	"done":        {},
	"user_id":     {},
	"created_at":  {},
	"updated_at":  {},
}

type ProspectActivityResponse struct {
	ID           uint64     `json:"id"`
	ProspectID   *uint64    `json:"prospect_id"`
	ContactID    *uint64    `json:"contact_id"`
	Type         string     `json:"type"`
	Summary      string     `json:"summary"`
	Note         *string    `json:"note"`
	Outcome      *string    `json:"outcome"`
	NextStep     *string    `json:"next_step"`
	NextStepDue  *time.Time `json:"next_step_due"`
	Participants *string    `json:"participants"`
	DueDate      *time.Time `json:"due_date"`
	Done         bool       `json:"done"`
	DoneAt       *time.Time `json:"done_at"`
	UserID       *uint64    `json:"user_id"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

func newProspectActivityResponse(activity *crm.ProspectActivity) ProspectActivityResponse {
	return ProspectActivityResponse{
		ID:           activity.ID,
		ProspectID:   activity.ProspectID,
		ContactID:    activity.ContactID,
		Type:         activity.Type,
		Summary:      activity.Summary,
		Note:         activity.Note,
		Outcome:      activity.Outcome,
		NextStep:     activity.NextStep,
		NextStepDue:  activity.NextStepDue,
		Participants: activity.Participants,
		DueDate:      activity.DueDate,
		Done:         activity.Done,
		DoneAt:       activity.DoneAt,
		UserID:       activity.UserID,
		CreatedAt:    activity.CreatedAt,
		UpdatedAt:    activity.UpdatedAt,
	}
}

func writeProspectActivityError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "crm activity write failed", "Failed to save activity.",
		httpx.NotFound(crm.ErrActivityNotFound, "Activity not found."),
		httpx.Unprocessable(crm.ErrActivitySummaryRequired, "Activity summary is required."),
		httpx.Conflict(crm.ErrActivityDone, "Activity is already done."),
		httpx.Unprocessable(crm.ErrLeadNotFound, "CRM prospect does not exist."),
		httpx.Unprocessable(crm.ErrContactNotFound, "CRM contact does not exist."),
		httpx.Conflict(crm.ErrDoNotContact, "Prospect has opted out of outbound contact."),
		httpx.Conflict(crm.ErrConsentRequired, "Prospect has not granted consent for outbound contact."),
		httpx.Unprocessable(crm.ErrConsentOverrideReason, "A reason is required to override consent."),
	)
}
