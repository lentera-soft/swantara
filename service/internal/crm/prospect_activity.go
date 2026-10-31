package crm

import (
	"context"
	"strings"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/contacts"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"

	"github.com/jalusw/swantara/apps/service/internal/kernel/clock"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type ProspectActivityService struct {
	activities ProspectActivityDAO
	leads      ProspectDAO
	contacts   contacts.ContactDAO
	history    StageHistoryDAO
	now        func() time.Time
}

func NewProspectActivityService(activities ProspectActivityDAO, leads ProspectDAO, contacts contacts.ContactDAO) ProspectActivityService {
	return ProspectActivityService{activities: activities, leads: leads, contacts: contacts, now: clock.Now}
}

func (s ProspectActivityService) WithClock(now func() time.Time) ProspectActivityService {
	s.now = now
	return s
}

func (s ProspectActivityService) WithStageHistory(history StageHistoryDAO) ProspectActivityService {
	s.history = history
	return s
}

func (s ProspectActivityService) List(ctx context.Context, q *query.Query) (*query.Page[ProspectActivity], error) {
	return s.activities.List(ctx, q)
}

func (s ProspectActivityService) ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[ProspectActivity], error) {
	return s.activities.ListInOrg(ctx, q, organizationID)
}

func (s ProspectActivityService) Find(ctx context.Context, id uint64) (*ProspectActivity, error) {
	return s.activities.Find(ctx, id)
}

func (s ProspectActivityService) FindInOrg(ctx context.Context, id, organizationID uint64) (*ProspectActivity, error) {
	return s.activities.FindInOrg(ctx, id, organizationID)
}

func (s ProspectActivityService) Delete(ctx context.Context, id uint64) error {
	return s.activities.Delete(ctx, id)
}

func (s ProspectActivityService) CreateActivity(ctx context.Context, organizationID uint64, activity *ProspectActivity) (*ProspectActivity, error) {
	consentOverride, err := s.validateActivity(ctx, organizationID, activity)
	if err != nil {
		return nil, err
	}
	if actorID := model.ActorID(ctx); actorID != 0 {
		activity.UserID = &actorID
	}
	created, err := s.activities.Create(ctx, activity)
	if err != nil {
		return nil, err
	}
	if consentOverride && created.ProspectID != nil {
		s.recordConsentOverride(ctx, *created.ProspectID, created.ConsentOverrideReason)
	}
	s.syncFollowUp(ctx, created)
	return created, nil
}

func (s ProspectActivityService) UpdateActivity(ctx context.Context, organizationID uint64, activity *ProspectActivity) (*ProspectActivity, error) {
	if _, err := s.validateActivity(ctx, organizationID, activity); err != nil {
		return nil, err
	}
	if activity.Done && activity.DoneAt == nil {
		now := s.now()
		activity.DoneAt = &now
	}
	updated, err := s.activities.Update(ctx, activity)
	if err != nil {
		return nil, err
	}
	s.syncFollowUp(ctx, updated)
	return updated, nil
}

func (s ProspectActivityService) MarkDone(ctx context.Context, activityID uint64) (*ProspectActivity, error) {
	activity, err := s.activities.Find(ctx, activityID)
	if err != nil {
		return nil, dao.NotFound(err, ErrActivityNotFound)
	}
	if activity == nil {
		return nil, ErrActivityNotFound
	}
	if activity.Done {
		return nil, ErrActivityDone
	}

	now := s.now()
	activity.Done = true
	activity.DoneAt = &now
	updated, err := s.activities.Update(ctx, activity)
	if err != nil {
		return nil, err
	}
	s.syncFollowUp(ctx, updated)
	return updated, nil
}

func (s ProspectActivityService) validateActivity(ctx context.Context, organizationID uint64, activity *ProspectActivity) (bool, error) {
	if strings.TrimSpace(activity.Summary) == "" {
		return false, ErrActivitySummaryRequired
	}
	if activity.Type == "" {
		activity.Type = ProspectActivityTypeNote
	}
	if activity.Outcome != nil && !validActivityOutcome(*activity.Outcome) {
		return false, ErrInvalidActivityOutcome
	}
	consentOverride := false
	if activity.ProspectID != nil {
		prospect, err := s.leads.Find(ctx, *activity.ProspectID)
		if err != nil {
			return false, dao.NotFound(err, ErrLeadNotFound)
		}
		if prospect == nil || !leadBelongsToOrg(prospect, organizationID) {
			return false, ErrLeadNotFound
		}
		if isOutboundActivity(activity.Type) {
			if prospect.DoNotContact {
				return false, ErrDoNotContact
			}
			if !prospect.ConsentGranted {
				if !activity.AllowConsentOverride {
					return false, ErrConsentRequired
				}
				if activity.ConsentOverrideReason == nil || strings.TrimSpace(*activity.ConsentOverrideReason) == "" {
					return false, ErrConsentOverrideReason
				}
				consentOverride = true
			}
		}
	}
	if activity.ContactID != nil {
		contact, err := s.contacts.Find(ctx, *activity.ContactID)
		if err != nil {
			return false, dao.NotFound(err, ErrContactNotFound)
		}
		if contact == nil || !contactBelongsToOrg(contact, organizationID) {
			return false, ErrContactNotFound
		}
	}
	return consentOverride, nil
}

func (s ProspectActivityService) recordConsentOverride(ctx context.Context, prospectID uint64, reason *string) {
	if s.history == nil {
		return
	}
	note := "consent override for outbound activity"
	if reason != nil && strings.TrimSpace(*reason) != "" {
		note += ": " + strings.TrimSpace(*reason)
	}
	entry := &ProspectStageHistory{ProspectID: prospectID, Notes: &note}
	if actorID := model.ActorID(ctx); actorID != 0 {
		entry.ActorID = &actorID
	}
	_, _ = s.history.Create(ctx, entry)
}

func (s ProspectActivityService) syncFollowUp(ctx context.Context, activity *ProspectActivity) {
	if activity.ProspectID == nil {
		return
	}
	prospect, err := s.leads.Find(ctx, *activity.ProspectID)
	if err != nil || prospect == nil {
		return
	}
	now := s.now()
	prospect.LastActivityAt = &now
	if isOutboundActivity(activity.Type) {
		if prospect.FirstContactedAt == nil {
			prospect.FirstContactedAt = &now
		}
		if prospect.Status == ProspectStatusNew {
			prospect.Status = ProspectStatusContacted
		}
	}
	if activity.NextStep != nil && strings.TrimSpace(*activity.NextStep) != "" {
		prospect.NextStep = activity.NextStep
		prospect.NextStepDue = activity.NextStepDue
	}
	if activity.Done {
		prospect.LastActivityAt = &now
	}
	prospect.LeadScore = calculateLeadScore(prospect)
	_, _ = s.leads.Update(ctx, prospect)
}

func isOutboundActivity(activityType string) bool {
	switch activityType {
	case ProspectActivityTypeCall, ProspectActivityTypeEmail, ProspectActivityTypeMeeting:
		return true
	default:
		return false
	}
}

func validActivityOutcome(value string) bool {
	switch value {
	case ActivityOutcomeConnected, ActivityOutcomeNoAnswer, ActivityOutcomeLeftMessage,
		ActivityOutcomeMeetingHeld, ActivityOutcomeDemoDone, ActivityOutcomeProposalSent,
		ActivityOutcomeFollowUp, ActivityOutcomeNotInterested, ActivityOutcomeOther:
		return true
	default:
		return false
	}
}

func leadBelongsToOrg(prospect *Prospect, organizationID uint64) bool {
	return prospect.OrganizationID != nil && *prospect.OrganizationID == organizationID
}

func contactBelongsToOrg(contact *contacts.Contact, organizationID uint64) bool {
	return contact.OrganizationID != nil && *contact.OrganizationID == organizationID
}
