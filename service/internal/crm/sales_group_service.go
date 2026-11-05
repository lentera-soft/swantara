package crm

import (
	"context"
	"strings"

	"github.com/jalusw/swantara/apps/service/internal/contacts"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/kernel/scope"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

// SalesGroupService manages the CRM sales teams referenced by prospects and
// sale documents. Team names are required, and when a leader is set the leader
// must be a contact that belongs to the same organization.
type SalesGroupService struct {
	teams    dao.CRUD[reference.SalesGroup]
	contacts contacts.ContactDAO
}

func NewSalesGroupService(teams dao.CRUD[reference.SalesGroup], contacts contacts.ContactDAO) SalesGroupService {
	return SalesGroupService{teams: teams, contacts: contacts}
}

func (s SalesGroupService) WithContacts(contacts contacts.ContactDAO) SalesGroupService {
	s.contacts = contacts
	return s
}

func (s SalesGroupService) ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[reference.SalesGroup], error) {
	return s.teams.ListInOrg(ctx, q, organizationID)
}

func (s SalesGroupService) FindInOrg(ctx context.Context, id, organizationID uint64) (*reference.SalesGroup, error) {
	team, err := s.teams.Find(ctx, id)
	if err != nil {
		return nil, dao.NotFound(err, ErrSalesGroupNotFound)
	}
	if team == nil || !scope.Owns(team.OrganizationID, organizationID) {
		return nil, nil
	}
	return team, nil
}

func (s SalesGroupService) Create(ctx context.Context, team *reference.SalesGroup) (*reference.SalesGroup, error) {
	if err := s.validate(ctx, team); err != nil {
		return nil, err
	}
	return s.teams.Create(ctx, team)
}

func (s SalesGroupService) Update(ctx context.Context, organizationID uint64, team *reference.SalesGroup) (*reference.SalesGroup, error) {
	existing, err := s.teams.Find(ctx, team.ID)
	if err != nil {
		return nil, dao.NotFound(err, ErrSalesGroupNotFound)
	}
	if existing == nil || !scope.Owns(existing.OrganizationID, organizationID) {
		return nil, ErrSalesGroupNotFound
	}
	team.OrganizationID = existing.OrganizationID
	if err := s.validate(ctx, team); err != nil {
		return nil, err
	}
	return s.teams.Update(ctx, team)
}

func (s SalesGroupService) Delete(ctx context.Context, organizationID, id uint64) error {
	existing, err := s.teams.Find(ctx, id)
	if err != nil {
		return dao.NotFound(err, ErrSalesGroupNotFound)
	}
	if existing == nil || !scope.Owns(existing.OrganizationID, organizationID) {
		return ErrSalesGroupNotFound
	}
	return s.teams.Delete(ctx, id)
}

func (s SalesGroupService) validate(ctx context.Context, team *reference.SalesGroup) error {
	team.Name = strings.TrimSpace(team.Name)
	if team.Name == "" {
		return ErrSalesGroupNameRequired
	}
	if team.LeaderID == nil || s.contacts == nil {
		return nil
	}
	leader, err := s.contacts.Find(ctx, *team.LeaderID)
	if err != nil {
		return dao.NotFound(err, ErrSalesGroupLeaderNotFound)
	}
	if leader == nil {
		return ErrSalesGroupLeaderNotFound
	}
	if !sameOrganizationID(leader.OrganizationID, team.OrganizationID) {
		return ErrSalesGroupLeaderOrganization
	}
	return nil
}
