//go:build test

package crm

import (
	"context"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
)

type ProspectDAOMock struct {
	dao.CRUDMock[Prospect]
	ListOpenFunc       func(ctx context.Context, organizationID *uint64) ([]*Prospect, error)
	CountWonFunc       func(ctx context.Context, organizationID *uint64) (int64, error)
	CountLostFunc      func(ctx context.Context, organizationID *uint64) (int64, error)
	FindDuplicatesFunc func(ctx context.Context, organizationID uint64, name, email, phone string, excludeID uint64) ([]*Prospect, error)
	MergeFunc          func(ctx context.Context, sourceID, targetID uint64) error
	ReassignOwnersFunc func(ctx context.Context, organizationID uint64, prospectIDs []uint64, ownerUserID *uint64) error
}

func (m ProspectDAOMock) ListOpen(ctx context.Context, organizationID *uint64) ([]*Prospect, error) {
	if m.ListOpenFunc != nil {
		return m.ListOpenFunc(ctx, organizationID)
	}
	return []*Prospect{}, nil
}

func (m ProspectDAOMock) CountWon(ctx context.Context, organizationID *uint64) (int64, error) {
	if m.CountWonFunc != nil {
		return m.CountWonFunc(ctx, organizationID)
	}
	return 0, nil
}

func (m ProspectDAOMock) CountLost(ctx context.Context, organizationID *uint64) (int64, error) {
	if m.CountLostFunc != nil {
		return m.CountLostFunc(ctx, organizationID)
	}
	return 0, nil
}

type ProspectActivityDAOMock struct {
	dao.CRUDMock[ProspectActivity]
}

func (m ProspectActivityDAOMock) ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[ProspectActivity], error) {
	return m.List(ctx, q)
}

func (m ProspectActivityDAOMock) FindInOrg(ctx context.Context, id, organizationID uint64) (*ProspectActivity, error) {
	return m.Find(ctx, id)
}

func (m ProspectDAOMock) FindDuplicates(ctx context.Context, organizationID uint64, name, email, phone string, excludeID uint64) ([]*Prospect, error) {
	if m.FindDuplicatesFunc != nil {
		return m.FindDuplicatesFunc(ctx, organizationID, name, email, phone, excludeID)
	}
	return []*Prospect{}, nil
}

func (m ProspectDAOMock) ReassignOwners(ctx context.Context, organizationID uint64, prospectIDs []uint64, ownerUserID *uint64) error {
	if m.ReassignOwnersFunc != nil {
		return m.ReassignOwnersFunc(ctx, organizationID, prospectIDs, ownerUserID)
	}
	return nil
}

func (m ProspectDAOMock) Merge(ctx context.Context, sourceID, targetID uint64) error {
	if m.MergeFunc != nil {
		return m.MergeFunc(ctx, sourceID, targetID)
	}
	return nil
}

type StageHistoryDAOMock struct {
	CreateFunc         func(ctx context.Context, entry *ProspectStageHistory) (*ProspectStageHistory, error)
	ListByProspectFunc func(ctx context.Context, prospectID uint64) ([]*ProspectStageHistory, error)
	ListInOrgFunc      func(ctx context.Context, organizationID uint64) ([]*ProspectStageHistory, error)
}

func (m StageHistoryDAOMock) Create(ctx context.Context, entry *ProspectStageHistory) (*ProspectStageHistory, error) {
	if m.CreateFunc != nil {
		return m.CreateFunc(ctx, entry)
	}
	return entry, nil
}

func (m StageHistoryDAOMock) ListByProspect(ctx context.Context, prospectID uint64) ([]*ProspectStageHistory, error) {
	if m.ListByProspectFunc != nil {
		return m.ListByProspectFunc(ctx, prospectID)
	}
	return []*ProspectStageHistory{}, nil
}

func (m StageHistoryDAOMock) ListInOrg(ctx context.Context, organizationID uint64) ([]*ProspectStageHistory, error) {
	if m.ListInOrgFunc != nil {
		return m.ListInOrgFunc(ctx, organizationID)
	}
	return []*ProspectStageHistory{}, nil
}

type ProspectContactDAOMock struct {
	ListByProspectFunc func(ctx context.Context, prospectID uint64) ([]*ProspectContact, error)
	FindFunc           func(ctx context.Context, id uint64) (*ProspectContact, error)
	CreateFunc         func(ctx context.Context, entry *ProspectContact) (*ProspectContact, error)
	DeleteFunc         func(ctx context.Context, id uint64) error
	ClearPrimaryFunc   func(ctx context.Context, prospectID uint64) error
}

func (m ProspectContactDAOMock) ListByProspect(ctx context.Context, prospectID uint64) ([]*ProspectContact, error) {
	if m.ListByProspectFunc != nil {
		return m.ListByProspectFunc(ctx, prospectID)
	}
	return []*ProspectContact{}, nil
}

func (m ProspectContactDAOMock) Find(ctx context.Context, id uint64) (*ProspectContact, error) {
	if m.FindFunc != nil {
		return m.FindFunc(ctx, id)
	}
	return nil, nil
}

func (m ProspectContactDAOMock) Create(ctx context.Context, entry *ProspectContact) (*ProspectContact, error) {
	if m.CreateFunc != nil {
		return m.CreateFunc(ctx, entry)
	}
	return entry, nil
}

func (m ProspectContactDAOMock) Delete(ctx context.Context, id uint64) error {
	if m.DeleteFunc != nil {
		return m.DeleteFunc(ctx, id)
	}
	return nil
}

func (m ProspectContactDAOMock) ClearPrimary(ctx context.Context, prospectID uint64) error {
	if m.ClearPrimaryFunc != nil {
		return m.ClearPrimaryFunc(ctx, prospectID)
	}
	return nil
}
