package crm

import (
	"context"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/contacts"
	"github.com/jalusw/swantara/apps/service/internal/iam"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/kernel/scope"
	"github.com/jalusw/swantara/apps/service/internal/reference"
	"github.com/jalusw/swantara/apps/service/internal/systemconfig"

	"github.com/jalusw/swantara/apps/service/internal/kernel/clock"
)

type ProspectService struct {
	leads       ProspectDAO
	stages      dao.CRUD[reference.PipelineStage]
	teams       dao.CRUD[reference.SalesGroup]
	contacts    contacts.ContactDAO
	history     StageHistoryDAO
	buyers      ProspectContactDAO
	configs     systemconfig.Lookup
	members     MemberDirectory
	permissions iam.PermissionDAO
	now         func() time.Time
}

func NewProspectService(
	leads ProspectDAO,
	stages dao.CRUD[reference.PipelineStage],
	teams dao.CRUD[reference.SalesGroup],
	contacts contacts.ContactDAO,
) ProspectService {
	return ProspectService{leads: leads, stages: stages, teams: teams, contacts: contacts, now: clock.Now}
}

func (s ProspectService) WithClock(now func() time.Time) ProspectService {
	s.now = now
	return s
}

func (s ProspectService) WithStageHistory(history StageHistoryDAO) ProspectService {
	s.history = history
	return s
}

func (s ProspectService) WithBuyingCommittee(buyers ProspectContactDAO) ProspectService {
	s.buyers = buyers
	return s
}

func (s ProspectService) WithConfigs(configs systemconfig.Lookup) ProspectService {
	s.configs = configs
	return s
}

func (s ProspectService) WithMembers(members MemberDirectory) ProspectService {
	s.members = members
	return s
}

func (s ProspectService) WithPermissions(permissions iam.PermissionDAO) ProspectService {
	s.permissions = permissions
	return s
}

func (s ProspectService) List(ctx context.Context, q *query.Query) (*query.Page[Prospect], error) {
	return s.leads.List(ctx, q)
}

func (s ProspectService) Find(ctx context.Context, id uint64) (*Prospect, error) {
	return s.leads.Find(ctx, id)
}

func (s ProspectService) Delete(ctx context.Context, id uint64) error {
	return s.leads.Delete(ctx, id)
}

func (s ProspectService) CreateLead(ctx context.Context, prospect *Prospect) (*Prospect, error) {
	if err := s.applyDefaults(prospect); err != nil {
		return nil, err
	}
	if err := s.validateLead(ctx, prospect); err != nil {
		return nil, err
	}
	if !prospect.AllowDuplicate {
		duplicates, err := s.duplicatesFor(ctx, prospect, 0)
		if err != nil {
			return nil, err
		}
		if len(duplicates) > 0 {
			return nil, ErrDuplicateLead
		}
	}
	stage, err := s.resolveStage(ctx, prospect.OrganizationID, prospect.StageID)
	if err != nil {
		return nil, err
	}
	if stage != nil && (stage.IsWon || stage.IsLost) {
		return nil, ErrInvalidTargetStage
	}
	now := s.now()
	if stage != nil {
		prospect.Probability = stage.Probability
		if prospect.StageEnteredAt == nil {
			prospect.StageEnteredAt = &now
		}
	}
	if prospect.Type == ProspectKindOpportunity {
		prospect.Status = ProspectStatusQualified
		if prospect.QualifiedAt == nil {
			prospect.QualifiedAt = &now
		}
	}
	if prospect.Status == ProspectStatusContacted && prospect.FirstContactedAt == nil {
		prospect.FirstContactedAt = &now
	}
	if prospect.Status == ProspectStatusQualified && prospect.QualifiedAt == nil {
		prospect.QualifiedAt = &now
	}
	if prospect.ConsentGranted && prospect.ConsentAt == nil {
		prospect.ConsentAt = &now
	}
	if prospect.OwnerUserID == nil {
		if actorID := model.ActorID(ctx); actorID != 0 {
			prospect.OwnerUserID = &actorID
		}
	}
	if err := s.validateOwner(ctx, prospect.OrganizationID, prospect.OwnerUserID); err != nil {
		return nil, err
	}
	prospect.LeadScore = calculateLeadScore(prospect)
	created, err := s.leads.Create(ctx, prospect)
	if err != nil {
		return nil, err
	}
	s.recordStage(ctx, created, nil, nil, nil, nil)
	return created, nil
}

func (s ProspectService) UpdateLead(ctx context.Context, prospect *Prospect) (*Prospect, error) {
	if err := s.applyDefaults(prospect); err != nil {
		return nil, err
	}
	if err := s.validateLead(ctx, prospect); err != nil {
		return nil, err
	}

	var existing *Prospect
	if prospect.ID != 0 {
		found, err := s.leads.Find(ctx, prospect.ID)
		if err != nil {
			return nil, err
		}
		existing = found
	}

	stage, err := s.resolveStage(ctx, prospect.OrganizationID, prospect.StageID)
	if err != nil {
		return nil, err
	}
	if stage != nil && (stage.IsWon || stage.IsLost) {
		return nil, ErrInvalidTargetStage
	}

	now := s.now()
	stageChanged := existing != nil && !sameID(existing.StageID, prospect.StageID)
	statusChanged := existing != nil && existing.Status != prospect.Status
	if existing != nil {
		switch existing.Type {
		case ProspectKindLead:
			if statusChanged {
				if !allowedLeadTransition(existing.Status, prospect.Status) {
					return nil, ErrInvalidStatusTransition
				}
				if prospect.Status == ProspectStatusDisqualified &&
					(prospect.LostReason == nil || strings.TrimSpace(*prospect.LostReason) == "") {
					return nil, ErrLostReasonRequired
				}
			}
		case ProspectKindOpportunity:
			if statusChanged && !allowedOpportunityTransition(existing.Status, prospect.Status) {
				return nil, ErrInvalidStatusTransition
			}
		}
	}

	if !prospect.AllowDuplicate {
		duplicates, err := s.duplicatesFor(ctx, prospect, prospect.ID)
		if err != nil {
			return nil, err
		}
		if len(duplicates) > 0 {
			return nil, ErrDuplicateLead
		}
	}
	if stage != nil {
		prospect.Probability = stage.Probability
	}
	if stageChanged {
		prospect.StageEnteredAt = &now
	} else if prospect.StageID != nil && prospect.StageEnteredAt == nil {
		if existing != nil {
			prospect.StageEnteredAt = existing.StageEnteredAt
		}
		if prospect.StageEnteredAt == nil {
			prospect.StageEnteredAt = &now
		}
	}
	if prospect.Type == ProspectKindOpportunity && prospect.Status == "" {
		prospect.Status = ProspectStatusQualified
	}
	if prospect.Status == ProspectStatusContacted && prospect.FirstContactedAt == nil {
		prospect.FirstContactedAt = &now
	}
	if prospect.Status == ProspectStatusQualified && prospect.QualifiedAt == nil {
		prospect.QualifiedAt = &now
	}
	if prospect.Status == ProspectStatusConverted && prospect.ConvertedAt == nil {
		prospect.ConvertedAt = &now
	}
	if prospect.ConsentGranted && prospect.ConsentAt == nil {
		prospect.ConsentAt = &now
	}
	if err := s.validateOwner(ctx, prospect.OrganizationID, prospect.OwnerUserID); err != nil {
		return nil, err
	}
	prospect.LeadScore = calculateLeadScore(prospect)
	updated, err := s.leads.Update(ctx, prospect)
	if err != nil {
		return nil, err
	}
	if existing != nil && (stageChanged || statusChanged) {
		fromStage := existing.StageID
		fromStatus := existing.Status
		s.recordStage(ctx, updated, fromStage, prospect.StageID, &fromStatus, &updated.Status)
	}
	return updated, nil
}

type PromotionInput struct {
	StageID          uint64     `json:"stage_id"`
	SalespersonID    *uint64    `json:"salesperson_id"`
	SalesGroupID     *uint64    `json:"sales_group_id"`
	ExpectedRevenue  float64    `json:"expected_revenue"`
	Probability      *float64   `json:"probability"`
	Priority         int16      `json:"priority"`
	ExpectedClose    *time.Time `json:"expected_close"`
	AllowUnqualified bool       `json:"allow_unqualified"`
}

func (s ProspectService) Promote(ctx context.Context, prospectID uint64, input PromotionInput) (*Prospect, error) {
	prospect, err := s.leads.Find(ctx, prospectID)
	if err != nil {
		return nil, dao.NotFound(err, ErrLeadNotFound)
	}
	if prospect == nil {
		return nil, ErrLeadNotFound
	}
	if prospect.Type != ProspectKindLead {
		return nil, ErrNotLead
	}
	if prospect.ClosedAt != nil || prospect.Status == ProspectStatusDisqualified || prospect.Status == ProspectStatusLost {
		return nil, ErrLeadClosed
	}
	organizationID := uint64(0)
	if prospect.OrganizationID != nil {
		organizationID = *prospect.OrganizationID
	}
	requiredFields, err := s.promotionRequiredFields(ctx, organizationID)
	if err != nil {
		return nil, err
	}
	if input.AllowUnqualified {
		if err := s.authorizePromotionOverride(ctx, organizationID); err != nil {
			return nil, err
		}
	} else if missing := missingPromotionFields(prospect, requiredFields); len(missing) > 0 {
		return nil, ErrPromotionRequirementsUnmet
	}

	stage, err := s.resolveStage(ctx, prospect.OrganizationID, &input.StageID)
	if err != nil {
		return nil, dao.NotFound(err, ErrStageRequired)
	}
	if stage == nil {
		return nil, ErrStageRequired
	}
	if stage.IsWon || stage.IsLost {
		return nil, ErrInvalidTargetStage
	}
	if err := s.validatePromotionRefs(ctx, prospect, input); err != nil {
		return nil, err
	}
	if input.ExpectedRevenue < 0 {
		return nil, ErrInvalidRevenue
	}
	if input.Priority < 0 {
		return nil, ErrInvalidPriority
	}

	now := s.now()
	fromStage := prospect.StageID
	fromStatus := prospect.Status
	prospect.Type = ProspectKindOpportunity
	prospect.Status = ProspectStatusConverted
	prospect.StageID = &stage.ID
	if input.SalespersonID != nil {
		prospect.SalespersonID = input.SalespersonID
	}
	if input.SalesGroupID != nil {
		prospect.SalesGroupID = input.SalesGroupID
	}
	prospect.ExpectedRevenue = input.ExpectedRevenue
	prospect.Priority = input.Priority
	prospect.ExpectedClose = input.ExpectedClose
	prospect.ConvertedAt = &now
	if prospect.QualifiedAt == nil {
		prospect.QualifiedAt = &now
	}
	prospect.StageEnteredAt = &now
	if input.Probability != nil {
		if *input.Probability < 0 || *input.Probability > 100 {
			return nil, ErrInvalidProbability
		}
		prospect.Probability = *input.Probability
	} else {
		prospect.Probability = stage.Probability
	}
	prospect.LeadScore = calculateLeadScore(prospect)

	updated, err := s.leads.Update(ctx, prospect)
	if err != nil {
		return nil, err
	}
	s.recordStageWithNotes(ctx, updated, fromStage, &stage.ID, &fromStatus, &updated.Status, promotionEvidenceNote(requiredFields, input.AllowUnqualified))
	return updated, nil
}

func (s ProspectService) AdvanceStage(ctx context.Context, prospectID, stageID uint64) (*Prospect, error) {
	return s.AdvanceStageWithInput(ctx, prospectID, StageAdvanceInput{StageID: stageID, ExitCriteriaMet: true})
}

type StageAdvanceInput struct {
	StageID         uint64  `json:"stage_id"`
	ExitCriteriaMet bool    `json:"exit_criteria_met"`
	Notes           *string `json:"notes"`
	LostReason      *string `json:"lost_reason"`
	LostReasonCode  *string `json:"lost_reason_code"`
}

func (s ProspectService) AdvanceStageWithInput(ctx context.Context, prospectID uint64, input StageAdvanceInput) (*Prospect, error) {
	prospect, err := s.openOpportunity(ctx, prospectID)
	if err != nil {
		return nil, err
	}
	stage, err := s.resolveStage(ctx, prospect.OrganizationID, &input.StageID)
	if err != nil {
		return nil, dao.NotFound(err, ErrStageNotFound)
	}
	if stage == nil {
		return nil, ErrStageNotFound
	}
	if prospect.StageID != nil && *prospect.StageID == stage.ID {
		return prospect, nil
	}
	if stage.ExitCriteria != nil && strings.TrimSpace(*stage.ExitCriteria) != "" && !input.ExitCriteriaMet {
		return nil, ErrExitCriteriaNotMet
	}

	now := s.now()
	fromStage := prospect.StageID
	fromStatus := prospect.Status
	if stage.IsLost {
		reason := strings.TrimSpace(valueOrEmpty(input.LostReason))
		if reason == "" {
			reason = strings.TrimSpace(valueOrEmpty(input.Notes))
		}
		if reason == "" {
			return nil, ErrLostReasonRequired
		}
		prospect.LostReason = &reason
		prospect.LostReasonCode = input.LostReasonCode
		prospect.Status = ProspectStatusLost
		prospect.Probability = 0
		prospect.ClosedAt = &now
	} else {
		prospect.Status = ProspectStatusQualified
		prospect.LostReason = nil
		prospect.LostReasonCode = nil
		prospect.Probability = stage.Probability
		if stage.IsWon {
			prospect.Status = ProspectStatusWon
			prospect.Probability = 100
			prospect.ClosedAt = &now
		}
	}
	prospect.StageID = &stage.ID
	prospect.StageEnteredAt = &now
	updated, err := s.leads.Update(ctx, prospect)
	if err != nil {
		return nil, err
	}
	s.recordStageWithNotes(ctx, updated, fromStage, &stage.ID, &fromStatus, &updated.Status, input.Notes)
	return updated, nil
}

func (s ProspectService) Win(ctx context.Context, prospectID uint64) (*Prospect, error) {
	prospect, err := s.openOpportunity(ctx, prospectID)
	if err != nil {
		return nil, err
	}
	won, err := s.wonStage(ctx, prospect.OrganizationID)
	if err != nil {
		return nil, dao.NotFound(err, ErrNoWonStage)
	}
	if won == nil {
		return nil, ErrNoWonStage
	}

	now := s.now()
	fromStage := prospect.StageID
	fromStatus := prospect.Status
	prospect.StageID = &won.ID
	prospect.Status = ProspectStatusWon
	prospect.Probability = 100
	prospect.LostReason = nil
	prospect.LostReasonCode = nil
	prospect.ClosedAt = &now
	prospect.StageEnteredAt = &now
	updated, err := s.leads.Update(ctx, prospect)
	if err != nil {
		return nil, err
	}
	s.recordStage(ctx, updated, fromStage, &won.ID, &fromStatus, &updated.Status)
	return updated, nil
}

func (s ProspectService) Lose(ctx context.Context, prospectID uint64, lostReason string) (*Prospect, error) {
	return s.LoseWithReason(ctx, prospectID, lostReason, nil)
}

func (s ProspectService) LoseWithReason(ctx context.Context, prospectID uint64, lostReason string, code *string) (*Prospect, error) {
	prospect, err := s.openOpportunity(ctx, prospectID)
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(lostReason) == "" {
		return nil, ErrLostReasonRequired
	}

	now := s.now()
	fromStage := prospect.StageID
	fromStatus := prospect.Status
	lost, err := s.lostStage(ctx, prospect.OrganizationID)
	if err != nil {
		return nil, err
	}
	if lost != nil {
		prospect.StageID = &lost.ID
		prospect.StageEnteredAt = &now
	}
	prospect.Status = ProspectStatusLost
	prospect.LostReason = &lostReason
	prospect.LostReasonCode = code
	prospect.Probability = 0
	prospect.ClosedAt = &now
	updated, err := s.leads.Update(ctx, prospect)
	if err != nil {
		return nil, err
	}
	toStage := prospect.StageID
	s.recordStage(ctx, updated, fromStage, toStage, &fromStatus, &updated.Status)
	return updated, nil
}

type LeadTransitionInput struct {
	Status         string  `json:"status"`
	Reason         string  `json:"reason"`
	LostReasonCode *string `json:"lost_reason_code"`
}

func (s ProspectService) TransitionStatus(ctx context.Context, prospectID uint64, input LeadTransitionInput) (*Prospect, error) {
	status := strings.TrimSpace(input.Status)
	if !validStatus(status) {
		return nil, ErrInvalidStatus
	}
	prospect, err := s.leads.Find(ctx, prospectID)
	if err != nil {
		return nil, dao.NotFound(err, ErrLeadNotFound)
	}
	if prospect == nil {
		return nil, ErrLeadNotFound
	}
	if prospect.Type == ProspectKindOpportunity {
		return nil, ErrNotLead
	}
	if !allowedLeadTransition(prospect.Status, status) {
		return nil, ErrInvalidStatusTransition
	}
	if status == ProspectStatusDisqualified && strings.TrimSpace(input.Reason) == "" {
		return nil, ErrLostReasonRequired
	}

	now := s.now()
	fromStatus := prospect.Status
	prospect.Status = status
	switch status {
	case ProspectStatusContacted:
		if prospect.FirstContactedAt == nil {
			prospect.FirstContactedAt = &now
		}
		prospect.ClosedAt = nil
		prospect.LostReason = nil
		prospect.LostReasonCode = nil
	case ProspectStatusQualified:
		if prospect.QualifiedAt == nil {
			prospect.QualifiedAt = &now
		}
		prospect.ClosedAt = nil
		prospect.LostReason = nil
		prospect.LostReasonCode = nil
	case ProspectStatusNurtured:
		prospect.ClosedAt = nil
	case ProspectStatusDisqualified:
		prospect.ClosedAt = &now
		prospect.LostReason = &input.Reason
		prospect.LostReasonCode = input.LostReasonCode
		prospect.Probability = 0
	}
	prospect.LeadScore = calculateLeadScore(prospect)
	updated, err := s.leads.Update(ctx, prospect)
	if err != nil {
		return nil, err
	}
	s.recordStatus(ctx, updated, &fromStatus, &updated.Status)
	return updated, nil
}

func (s ProspectService) ReassignOwner(ctx context.Context, prospectID, organizationID uint64, ownerUserID *uint64) (*Prospect, error) {
	prospect, err := s.FindInOrg(ctx, prospectID, organizationID)
	if err != nil {
		return nil, dao.NotFound(err, ErrLeadNotFound)
	}
	if prospect == nil {
		return nil, ErrLeadNotFound
	}
	ownerOrgID := organizationID
	if err := s.validateOwner(ctx, &ownerOrgID, ownerUserID); err != nil {
		return nil, err
	}
	prospect.OwnerUserID = ownerUserID
	prospect.LeadScore = calculateLeadScore(prospect)
	updated, err := s.leads.Update(ctx, prospect)
	if err != nil {
		return nil, err
	}
	s.recordOwnerAssignment(ctx, updated, ownerUserID)
	return updated, nil
}

func (s ProspectService) ReassignOwners(ctx context.Context, organizationID uint64, prospectIDs []uint64, ownerUserID *uint64) ([]*Prospect, error) {
	ownerOrgID := organizationID
	if err := s.validateOwner(ctx, &ownerOrgID, ownerUserID); err != nil {
		return nil, err
	}
	prospects := make([]*Prospect, 0, len(prospectIDs))
	for _, prospectID := range prospectIDs {
		prospect, err := s.FindInOrg(ctx, prospectID, organizationID)
		if err != nil {
			return nil, dao.NotFound(err, ErrLeadNotFound)
		}
		if prospect == nil {
			return nil, ErrLeadNotFound
		}
		prospects = append(prospects, prospect)
	}
	if err := s.leads.ReassignOwners(ctx, organizationID, prospectIDs, ownerUserID); err != nil {
		return nil, dao.NotFound(err, ErrLeadNotFound)
	}
	for _, prospect := range prospects {
		prospect.OwnerUserID = ownerUserID
		prospect.LeadScore = calculateLeadScore(prospect)
		s.recordOwnerAssignment(ctx, prospect, ownerUserID)
	}
	return prospects, nil
}

func (s ProspectService) recordOwnerAssignment(ctx context.Context, prospect *Prospect, ownerUserID *uint64) {
	status := prospect.Status
	note := "owner unassigned"
	if ownerUserID != nil {
		note = "owner reassigned to user " + strconv.FormatUint(*ownerUserID, 10)
	}
	s.recordStageWithNotes(ctx, prospect, prospect.StageID, prospect.StageID, &status, &status, &note)
}

func (s ProspectService) Duplicates(ctx context.Context, id uint64) ([]*Prospect, error) {
	prospect, err := s.leads.Find(ctx, id)
	if err != nil {
		return nil, dao.NotFound(err, ErrLeadNotFound)
	}
	if prospect == nil {
		return nil, ErrLeadNotFound
	}
	return s.duplicatesFor(ctx, prospect, prospect.ID)
}

func (s ProspectService) Merge(ctx context.Context, sourceID, targetID uint64) (*Prospect, error) {
	if sourceID == targetID {
		return nil, ErrSameProspect
	}
	source, err := s.leads.Find(ctx, sourceID)
	if err != nil {
		return nil, dao.NotFound(err, ErrLeadNotFound)
	}
	target, err := s.leads.Find(ctx, targetID)
	if err != nil {
		return nil, dao.NotFound(err, ErrMergeTargetNotFound)
	}
	if source == nil {
		return nil, ErrLeadNotFound
	}
	if target == nil {
		return nil, ErrMergeTargetNotFound
	}
	if !sameOrganization(source, target) {
		return nil, ErrMergeOrganization
	}
	mergeProspectFields(source, target)
	target.LeadScore = calculateLeadScore(target)
	updated, err := s.leads.Update(ctx, target)
	if err != nil {
		return nil, err
	}
	if err := s.leads.Merge(ctx, sourceID, targetID); err != nil {
		return nil, err
	}
	return updated, nil
}

func (s ProspectService) StageHistory(ctx context.Context, prospectID uint64) ([]*ProspectStageHistory, error) {
	prospect, err := s.leads.Find(ctx, prospectID)
	if err != nil {
		return nil, dao.NotFound(err, ErrLeadNotFound)
	}
	if prospect == nil {
		return nil, ErrLeadNotFound
	}
	if s.history == nil {
		return []*ProspectStageHistory{}, nil
	}
	return s.history.ListByProspect(ctx, prospectID)
}

func (s ProspectService) AddBuyer(ctx context.Context, organizationID, prospectID uint64, input ProspectBuyerInput) (*ProspectContact, error) {
	if s.buyers == nil {
		return nil, ErrBuyingCommitteeUnavailable
	}
	prospect, err := s.leads.Find(ctx, prospectID)
	if err != nil {
		return nil, dao.NotFound(err, ErrLeadNotFound)
	}
	if prospect == nil || !scope.Owns(prospect.OrganizationID, organizationID) {
		return nil, ErrLeadNotFound
	}
	contact, err := s.contacts.Find(ctx, input.ContactID)
	if err != nil {
		return nil, dao.NotFound(err, ErrContactNotFound)
	}
	if contact == nil || !scope.Owns(contact.OrganizationID, organizationID) {
		return nil, ErrContactNotFound
	}
	role := strings.TrimSpace(input.Role)
	if role == "" {
		role = ProspectContactRoleInfluencer
	}
	if !validBuyerRole(role) {
		return nil, ErrInvalidBuyerRole
	}
	if input.IsPrimary {
		if err := s.buyers.ClearPrimary(ctx, prospectID); err != nil {
			return nil, err
		}
	}
	return s.buyers.Create(ctx, &ProspectContact{
		ProspectID: prospectID,
		ContactID:  input.ContactID,
		Role:       role,
		IsPrimary:  input.IsPrimary,
	})
}

type ProspectBuyerInput struct {
	ContactID uint64 `json:"contact_id"`
	Role      string `json:"role"`
	IsPrimary bool   `json:"is_primary"`
}

func (s ProspectService) ListBuyers(ctx context.Context, organizationID, prospectID uint64) ([]*ProspectContact, error) {
	if s.buyers == nil {
		return []*ProspectContact{}, nil
	}
	prospect, err := s.leads.Find(ctx, prospectID)
	if err != nil {
		return nil, dao.NotFound(err, ErrLeadNotFound)
	}
	if prospect == nil || !scope.Owns(prospect.OrganizationID, organizationID) {
		return nil, ErrLeadNotFound
	}
	return s.buyers.ListByProspect(ctx, prospectID)
}

func (s ProspectService) RemoveBuyer(ctx context.Context, organizationID, prospectID, buyerID uint64) error {
	if s.buyers == nil {
		return ErrBuyingCommitteeUnavailable
	}
	prospect, err := s.leads.Find(ctx, prospectID)
	if err != nil {
		return dao.NotFound(err, ErrLeadNotFound)
	}
	if prospect == nil || !scope.Owns(prospect.OrganizationID, organizationID) {
		return ErrLeadNotFound
	}
	buyer, err := s.buyers.Find(ctx, buyerID)
	if err != nil {
		return dao.NotFound(err, ErrBuyerNotFound)
	}
	if buyer == nil || buyer.ProspectID != prospectID {
		return ErrBuyerNotFound
	}
	return s.buyers.Delete(ctx, buyerID)
}

func (s ProspectService) openOpportunity(ctx context.Context, prospectID uint64) (*Prospect, error) {
	prospect, err := s.leads.Find(ctx, prospectID)
	if err != nil {
		return nil, dao.NotFound(err, ErrLeadNotFound)
	}
	if prospect == nil {
		return nil, ErrLeadNotFound
	}
	if prospect.Type != ProspectKindOpportunity {
		return nil, ErrNotOpportunity
	}
	if prospect.ClosedAt != nil || prospect.Status == ProspectStatusWon || prospect.Status == ProspectStatusLost {
		return nil, ErrLeadClosed
	}
	return prospect, nil
}

func (s ProspectService) applyDefaults(prospect *Prospect) error {
	prospect.Name = strings.TrimSpace(prospect.Name)
	if prospect.Type == "" {
		prospect.Type = ProspectKindLead
	}
	if prospect.Status == "" {
		if prospect.Type == ProspectKindOpportunity {
			prospect.Status = ProspectStatusQualified
		} else {
			prospect.Status = ProspectStatusNew
		}
	}
	if prospect.Temperature == "" {
		prospect.Temperature = ProspectTemperatureWarm
	}
	if prospect.ForecastCategory == "" {
		prospect.ForecastCategory = ForecastCategoryPipeline
	}
	if strings.TrimSpace(prospect.CurrencyCode) == "" {
		prospect.CurrencyCode = "IDR"
	}
	prospect.CurrencyCode = strings.ToUpper(strings.TrimSpace(prospect.CurrencyCode))
	if prospect.DoNotContact {
		prospect.ConsentGranted = false
	}
	if prospect.Source == nil || strings.TrimSpace(*prospect.Source) == "" {
		prospect.Source = ptrString("unknown")
	}
	return nil
}

func (s ProspectService) validateLead(ctx context.Context, prospect *Prospect) error {
	if strings.TrimSpace(prospect.Name) == "" {
		return ErrLeadNameRequired
	}
	if !validLeadType(prospect.Type) {
		return ErrInvalidLeadType
	}
	if prospect.Type == ProspectKindOpportunity {
		if prospect.StageID == nil {
			return ErrStageRequired
		}
		if !prospect.AllowUnqualified {
			organizationID := uint64(0)
			if prospect.OrganizationID != nil {
				organizationID = *prospect.OrganizationID
			}
			requiredFields, err := s.promotionRequiredFields(ctx, organizationID)
			if err != nil {
				return err
			}
			if missing := missingPromotionFields(prospect, requiredFields); len(missing) > 0 {
				return ErrPromotionRequirementsUnmet
			}
		}
	}
	if !validStatus(prospect.Status) {
		return ErrInvalidStatus
	}
	if !validTemperature(prospect.Temperature) {
		return ErrInvalidTemperature
	}
	if !validForecastCategory(prospect.ForecastCategory) {
		return ErrInvalidForecastCategory
	}
	if prospect.ExpectedRevenue < 0 {
		return ErrInvalidRevenue
	}
	if prospect.BudgetAmount != nil && *prospect.BudgetAmount < 0 {
		return ErrInvalidBudget
	}
	if prospect.Probability < 0 || prospect.Probability > 100 {
		return ErrInvalidProbability
	}
	if prospect.Priority < 0 {
		return ErrInvalidPriority
	}
	if prospect.FitScore < 0 || prospect.FitScore > 100 {
		return ErrInvalidFitScore
	}
	if prospect.IntentScore < 0 || prospect.IntentScore > 100 {
		return ErrInvalidIntentScore
	}
	if len(prospect.CurrencyCode) != 3 {
		return ErrInvalidCurrency
	}
	if err := s.validateLeadRefs(ctx, prospect); err != nil {
		return err
	}
	return nil
}

func missingPromotionFields(prospect *Prospect, required []string) []string {
	missing := make([]string, 0, len(required))
	for _, field := range required {
		if !hasPromotionField(prospect, field) {
			missing = append(missing, field)
		}
	}
	return missing
}

func hasPromotionField(prospect *Prospect, field string) bool {
	switch field {
	case "contact":
		if prospect.ContactID != nil {
			return true
		}
		if prospect.ContactName != nil && strings.TrimSpace(*prospect.ContactName) != "" {
			return true
		}
		return prospect.Email != nil && strings.TrimSpace(*prospect.Email) != ""
	case "need":
		return prospect.NeedSummary != nil && strings.TrimSpace(*prospect.NeedSummary) != ""
	case "budget":
		return prospect.BudgetConfirmed && prospect.BudgetAmount != nil
	case "authority":
		return prospect.AuthorityConfirm
	case "timeline":
		return prospect.TimelineDate != nil
	case "consent":
		return prospect.ConsentGranted
	default:
		return true
	}
}

func (s ProspectService) validateLeadRefs(ctx context.Context, prospect *Prospect) error {
	if prospect.ContactID != nil {
		contact, err := s.contacts.Find(ctx, *prospect.ContactID)
		if err != nil {
			return dao.NotFound(err, ErrContactNotFound)
		}
		if contact == nil {
			return ErrContactNotFound
		}
		if !sameOrganizationID(contact.OrganizationID, prospect.OrganizationID) {
			return ErrContactOrganization
		}
	}
	if err := s.validateSalesperson(ctx, prospect.OrganizationID, prospect.SalespersonID); err != nil {
		return err
	}
	if err := s.validateSalesGroup(ctx, prospect.OrganizationID, prospect.SalesGroupID); err != nil {
		return err
	}
	return s.validateOwner(ctx, prospect.OrganizationID, prospect.OwnerUserID)
}

func (s ProspectService) validatePromotionRefs(ctx context.Context, prospect *Prospect, input PromotionInput) error {
	if err := s.validateSalesperson(ctx, prospect.OrganizationID, input.SalespersonID); err != nil {
		return err
	}
	return s.validateSalesGroup(ctx, prospect.OrganizationID, input.SalesGroupID)
}

func (s ProspectService) validateSalesperson(ctx context.Context, organizationID, salespersonID *uint64) error {
	if salespersonID == nil {
		return nil
	}
	salesperson, err := s.contacts.Find(ctx, *salespersonID)
	if err != nil {
		return dao.NotFound(err, ErrSalespersonNotFound)
	}
	if salesperson == nil {
		return ErrSalespersonNotFound
	}
	if !sameOrganizationID(salesperson.OrganizationID, organizationID) {
		return ErrSalespersonOrganization
	}
	return nil
}

func (s ProspectService) validateSalesGroup(ctx context.Context, organizationID, salesTeamID *uint64) error {
	if salesTeamID == nil {
		return nil
	}
	team, err := s.teams.Find(ctx, *salesTeamID)
	if err != nil {
		return dao.NotFound(err, ErrSalesGroupNotFound)
	}
	if team == nil {
		return ErrSalesGroupNotFound
	}
	if organizationID != nil && team.OrganizationID != nil && *team.OrganizationID != *organizationID {
		return ErrSalesGroupOrganization
	}
	return nil
}

func (s ProspectService) validateOwner(ctx context.Context, organizationID, ownerUserID *uint64) error {
	if ownerUserID == nil || s.members == nil {
		return nil
	}
	if organizationID == nil {
		return ErrOwnerNotMember
	}
	active, err := s.members.IsActiveMember(ctx, *ownerUserID, *organizationID)
	if err != nil {
		return err
	}
	if !active {
		return ErrOwnerNotMember
	}
	return nil
}

func (s ProspectService) resolveStage(ctx context.Context, organizationID, stageID *uint64) (*reference.PipelineStage, error) {
	if stageID == nil {
		return nil, nil
	}
	stage, err := s.stages.Find(ctx, *stageID)
	if err != nil {
		return nil, dao.NotFound(err, ErrStageNotFound)
	}
	if stage == nil {
		return nil, ErrStageNotFound
	}
	if organizationID != nil && stage.OrganizationID != nil && *stage.OrganizationID != *organizationID {
		return nil, ErrStageOrganization
	}
	return stage, nil
}

func (s ProspectService) wonStage(ctx context.Context, organizationID *uint64) (*reference.PipelineStage, error) {
	return s.findStage(ctx, organizationID, func(stage reference.PipelineStage) bool { return stage.IsWon })
}

func (s ProspectService) lostStage(ctx context.Context, organizationID *uint64) (*reference.PipelineStage, error) {
	return s.findStage(ctx, organizationID, func(stage reference.PipelineStage) bool { return stage.IsLost })
}

func (s ProspectService) findStage(ctx context.Context, organizationID *uint64, match func(reference.PipelineStage) bool) (*reference.PipelineStage, error) {
	parsedQuery := &query.Query{}
	if organizationID != nil {
		parsedQuery.Filters = []query.Filter{{Field: "organization_id", Operator: query.Equal, Value: *organizationID}}
	}
	page, err := s.stages.List(ctx, parsedQuery)
	if err != nil {
		return nil, err
	}
	for _, stage := range page.Items {
		if match(*stage) {
			return stage, nil
		}
	}
	return nil, nil
}

func (s ProspectService) duplicatesFor(ctx context.Context, prospect *Prospect, excludeID uint64) ([]*Prospect, error) {
	if prospect.OrganizationID == nil {
		return []*Prospect{}, nil
	}
	email := valueOrEmpty(prospect.Email)
	phone := valueOrEmpty(prospect.Phone)
	name := ""
	if email == "" && phone == "" {
		name = prospect.Name
	}
	if email == "" && phone == "" && name == "" {
		return []*Prospect{}, nil
	}
	return s.leads.FindDuplicates(ctx, *prospect.OrganizationID, name, email, phone, excludeID)
}

func (s ProspectService) recordStage(ctx context.Context, prospect *Prospect, fromStage, toStage *uint64, fromStatus, toStatus *string) {
	s.recordStageWithNotes(ctx, prospect, fromStage, toStage, fromStatus, toStatus, nil)
}

func (s ProspectService) recordStageWithNotes(ctx context.Context, prospect *Prospect, fromStage, toStage *uint64, fromStatus, toStatus *string, notes *string) {
	if s.history == nil {
		return
	}
	entry := &ProspectStageHistory{
		ProspectID:  prospect.ID,
		FromStageID: fromStage,
		ToStageID:   toStage,
		FromStatus:  fromStatus,
		ToStatus:    toStatus,
		Probability: prospect.Probability,
		Notes:       notes,
	}
	if actorID := model.ActorID(ctx); actorID != 0 {
		entry.ActorID = &actorID
	}
	_, _ = s.history.Create(ctx, entry)
}

func (s ProspectService) recordStatus(ctx context.Context, prospect *Prospect, fromStatus, toStatus *string) {
	if s.history == nil {
		return
	}
	entry := &ProspectStageHistory{
		ProspectID:  prospect.ID,
		FromStageID: prospect.StageID,
		ToStageID:   prospect.StageID,
		FromStatus:  fromStatus,
		ToStatus:    toStatus,
		Probability: prospect.Probability,
	}
	if actorID := model.ActorID(ctx); actorID != 0 {
		entry.ActorID = &actorID
	}
	_, _ = s.history.Create(ctx, entry)
}

func calculateLeadScore(prospect *Prospect) int16 {
	if prospect.DoNotContact {
		return 0
	}
	fitIntent := (float64(prospect.FitScore) + float64(prospect.IntentScore)) / 2
	score := fitIntent * 0.6

	switch prospect.Temperature {
	case ProspectTemperatureHot:
		score += 20
	case ProspectTemperatureReferral:
		score += 18
	case ProspectTemperatureExisting:
		score += 16
	case ProspectTemperatureWarm:
		score += 10
	default:
		score += 2
	}

	if prospect.NeedSummary != nil && strings.TrimSpace(*prospect.NeedSummary) != "" {
		score += 5
	}
	if prospect.BudgetConfirmed {
		score += 5
	}
	if prospect.AuthorityConfirm {
		score += 5
	}
	if prospect.TimelineDate != nil {
		score += 5
	}
	if score < 0 {
		return 0
	}
	if score > 100 {
		return 100
	}
	return int16(math.Round(score))
}

func mergeProspectFields(source, target *Prospect) {
	if target.Email == nil {
		target.Email = source.Email
	}
	if target.Phone == nil {
		target.Phone = source.Phone
	}
	if target.ContactID == nil {
		target.ContactID = source.ContactID
	}
	if target.ContactName == nil {
		target.ContactName = source.ContactName
	}
	if target.JobPosition == nil {
		target.JobPosition = source.JobPosition
	}
	if target.Source == nil {
		target.Source = source.Source
	}
	if target.Medium == nil {
		target.Medium = source.Medium
	}
	if target.Campaign == nil {
		target.Campaign = source.Campaign
	}
	if target.SalespersonID == nil {
		target.SalespersonID = source.SalespersonID
	}
	if target.SalesGroupID == nil {
		target.SalesGroupID = source.SalesGroupID
	}
	if target.OwnerUserID == nil {
		target.OwnerUserID = source.OwnerUserID
	}
	if target.NeedSummary == nil {
		target.NeedSummary = source.NeedSummary
	}
	if target.BudgetAmount == nil {
		target.BudgetAmount = source.BudgetAmount
	}
	if !target.BudgetConfirmed {
		target.BudgetConfirmed = source.BudgetConfirmed
	}
	if !target.AuthorityConfirm {
		target.AuthorityConfirm = source.AuthorityConfirm
	}
	if target.TimelineDate == nil {
		target.TimelineDate = source.TimelineDate
	}
	if target.DecisionCriteria == nil {
		target.DecisionCriteria = source.DecisionCriteria
	}
	if target.Competition == nil {
		target.Competition = source.Competition
	}
	if target.ProposedSolution == nil {
		target.ProposedSolution = source.ProposedSolution
	}
	if target.NextStep == nil {
		target.NextStep = source.NextStep
	}
	if target.NextStepDue == nil {
		target.NextStepDue = source.NextStepDue
	}
	if target.QualificationNote == nil {
		target.QualificationNote = source.QualificationNote
	}
	if !target.ConsentGranted && source.ConsentGranted {
		target.ConsentGranted = true
		target.ConsentSource = source.ConsentSource
		target.ConsentAt = source.ConsentAt
	}
	if source.LeadScore > target.LeadScore {
		target.LeadScore = source.LeadScore
	}
	if source.FitScore > target.FitScore {
		target.FitScore = source.FitScore
	}
	if source.IntentScore > target.IntentScore {
		target.IntentScore = source.IntentScore
	}
}

func sameID(left, right *uint64) bool {
	if left == nil || right == nil {
		return left == nil && right == nil
	}
	return *left == *right
}

func sameOrganizationID(left, right *uint64) bool {
	if right == nil {
		return true
	}
	if left == nil {
		return false
	}
	return *left == *right
}

func allowedOpportunityTransition(from, to string) bool {
	if from == to {
		return true
	}
	switch to {
	case ProspectStatusNew, ProspectStatusContacted, ProspectStatusQualified, ProspectStatusNurtured, ProspectStatusConverted:
		return from != ProspectStatusWon && from != ProspectStatusLost && from != ProspectStatusDisqualified
	default:
		return false
	}
}

func sameOrganization(left, right *Prospect) bool {
	if left.OrganizationID == nil || right.OrganizationID == nil {
		return left.OrganizationID == nil && right.OrganizationID == nil
	}
	return *left.OrganizationID == *right.OrganizationID
}

func valueOrEmpty(value *string) string {
	if value == nil {
		return ""
	}
	return strings.TrimSpace(*value)
}

func validLeadType(value string) bool {
	return value == ProspectKindLead || value == ProspectKindOpportunity
}

func validStatus(value string) bool {
	switch value {
	case ProspectStatusNew, ProspectStatusContacted, ProspectStatusQualified, ProspectStatusNurtured,
		ProspectStatusDisqualified, ProspectStatusConverted, ProspectStatusWon, ProspectStatusLost:
		return true
	default:
		return false
	}
}

func validTemperature(value string) bool {
	switch value {
	case ProspectTemperatureCold, ProspectTemperatureWarm, ProspectTemperatureHot,
		ProspectTemperatureReferral, ProspectTemperatureExisting:
		return true
	default:
		return false
	}
}

func validForecastCategory(value string) bool {
	return value == ForecastCategoryPipeline || value == ForecastCategoryBestCase || value == ForecastCategoryCommit
}

func validBuyerRole(value string) bool {
	switch value {
	case ProspectContactRoleUser, ProspectContactRoleTechnical, ProspectContactRoleEconomicBuyer,
		ProspectContactRoleChampion, ProspectContactRoleBlocker, ProspectContactRoleInfluencer, ProspectContactRoleOther:
		return true
	default:
		return false
	}
}

func allowedLeadTransition(from, to string) bool {
	if from == "" {
		from = ProspectStatusNew
	}
	if from == to {
		return true
	}
	switch from {
	case ProspectStatusNew:
		return to == ProspectStatusContacted || to == ProspectStatusNurtured ||
			to == ProspectStatusDisqualified
	case ProspectStatusContacted:
		return to == ProspectStatusQualified || to == ProspectStatusNurtured || to == ProspectStatusDisqualified
	case ProspectStatusQualified:
		return to == ProspectStatusNurtured || to == ProspectStatusDisqualified
	case ProspectStatusNurtured:
		return to == ProspectStatusContacted || to == ProspectStatusQualified || to == ProspectStatusDisqualified
	case ProspectStatusDisqualified:
		return to == ProspectStatusContacted || to == ProspectStatusQualified
	default:
		return false
	}
}

func (s ProspectService) FindInOrg(ctx context.Context, id, organizationID uint64) (*Prospect, error) {
	e, err := s.leads.Find(ctx, id)
	if err != nil || e == nil || !scope.Owns(e.OrganizationID, organizationID) {
		return nil, err
	}
	return e, nil
}

func (s ProspectService) ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[Prospect], error) {
	return s.leads.List(ctx, scope.ToOrg(q, organizationID))
}

func ptrString(value string) *string {
	return &value
}

func (s ProspectService) authorizePromotionOverride(ctx context.Context, organizationID uint64) error {
	if s.permissions == nil {
		return nil
	}
	actorID := model.ActorID(ctx)
	if actorID == 0 {
		return ErrPromotionOverrideForbidden
	}
	owner, err := s.permissions.UserIsOrganizationOwner(ctx, actorID, organizationID)
	if err != nil {
		return err
	}
	if owner {
		return nil
	}
	allowed, err := s.permissions.UserHasOrganizationPermission(ctx, actorID, organizationID, "prospect", "override")
	if err != nil {
		return err
	}
	if !allowed {
		return ErrPromotionOverrideForbidden
	}
	return nil
}

func promotionEvidenceNote(fields []string, override bool) *string {
	if override {
		note := "promotion override: qualification requirements bypassed"
		return &note
	}
	note := "promotion evidence: " + strings.Join(fields, ", ")
	return &note
}
