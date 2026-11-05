package crm_test

import (
	"context"
	"errors"
	"testing"

	"github.com/jalusw/swantara/apps/service/internal/contacts"
	"github.com/jalusw/swantara/apps/service/internal/crm"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

func teamServiceWithContact(t *testing.T, leaderOrg *uint64) crm.SalesGroupService {
	t.Helper()
	found := &contacts.Contact{
		Base:           model.Base{ID: 7},
		Name:           "Lead",
		OrganizationID: leaderOrg,
	}
	finder := contacts.ContactDAOMock{
		CRUDMock: dao.CRUDMock[contacts.Contact]{
			FindFunc: func(_ context.Context, _ uint64) (*contacts.Contact, error) {
				return found, nil
			},
		},
	}
	teams := dao.CRUDMock[reference.SalesGroup]{
		CreateFunc: func(_ context.Context, team *reference.SalesGroup) (*reference.SalesGroup, error) {
			return team, nil
		},
	}
	return crm.NewSalesGroupService(teams, finder)
}

func TestSalesGroupService_CreateTrimsName(t *testing.T) {
	svc := crm.NewSalesGroupService(dao.CRUDMock[reference.SalesGroup]{
		CreateFunc: func(_ context.Context, team *reference.SalesGroup) (*reference.SalesGroup, error) {
			return team, nil
		},
	}, nil)

	created, err := svc.Create(context.Background(), &reference.SalesGroup{
		Name:           "  Enterprise  ",
		OrganizationID: helper.Ptr(uint64(10)),
	})
	if err != nil {
		t.Fatal(err)
	}
	if created.Name != "Enterprise" {
		t.Fatalf("name = %q, want %q", created.Name, "Enterprise")
	}
}

func TestSalesGroupService_Create_RejectsEmptyName(t *testing.T) {
	svc := crm.NewSalesGroupService(dao.CRUDMock[reference.SalesGroup]{
		CreateFunc: func(_ context.Context, _ *reference.SalesGroup) (*reference.SalesGroup, error) {
			t.Fatal("create must not run")
			return nil, nil
		},
	}, nil)

	_, err := svc.Create(context.Background(), &reference.SalesGroup{
		Name:           "   ",
		OrganizationID: helper.Ptr(uint64(10)),
	})
	if !errors.Is(err, crm.ErrSalesGroupNameRequired) {
		t.Fatalf("err = %v, want ErrSalesGroupNameRequired", err)
	}
}

func TestSalesGroupService_Create_RejectsForeignLeader(t *testing.T) {
	svc := teamServiceWithContact(t, helper.Ptr(uint64(99)))

	_, err := svc.Create(context.Background(), &reference.SalesGroup{
		Name:           "Enterprise",
		LeaderID:       helper.Ptr(uint64(7)),
		OrganizationID: helper.Ptr(uint64(10)),
	})
	if !errors.Is(err, crm.ErrSalesGroupLeaderOrganization) {
		t.Fatalf("err = %v, want ErrSalesGroupLeaderOrganization", err)
	}
}

func TestSalesGroupService_Create_AcceptsSameOrgLeader(t *testing.T) {
	svc := teamServiceWithContact(t, helper.Ptr(uint64(10)))

	created, err := svc.Create(context.Background(), &reference.SalesGroup{
		Name:           "Enterprise",
		LeaderID:       helper.Ptr(uint64(7)),
		OrganizationID: helper.Ptr(uint64(10)),
	})
	if err != nil {
		t.Fatal(err)
	}
	if created.LeaderID == nil || *created.LeaderID != 7 {
		t.Fatalf("leader not preserved: %+v", created)
	}
}

func TestSalesGroupService_Update_PreservesOrganization(t *testing.T) {
	var capturedOrg *uint64
	teams := dao.CRUDMock[reference.SalesGroup]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.SalesGroup, error) {
			return &reference.SalesGroup{
				Base:           model.Base{ID: 1},
				Name:           "Enterprise",
				OrganizationID: helper.Ptr(uint64(10)),
			}, nil
		},
		UpdateFunc: func(_ context.Context, team *reference.SalesGroup) (*reference.SalesGroup, error) {
			capturedOrg = team.OrganizationID
			return team, nil
		},
	}
	svc := crm.NewSalesGroupService(teams, nil)

	updated, err := svc.Update(context.Background(), 10, &reference.SalesGroup{
		Base: model.Base{ID: 1},
		Name: "Enterprise EMEA",
	})
	if err != nil {
		t.Fatal(err)
	}
	if capturedOrg == nil || *capturedOrg != 10 {
		t.Fatalf("organization not preserved: %v", capturedOrg)
	}
	if updated.Name != "Enterprise EMEA" {
		t.Fatalf("name = %q, want Enterprise EMEA", updated.Name)
	}
}

func TestSalesGroupService_Update_ReturnsNotFoundForOtherOrg(t *testing.T) {
	teams := dao.CRUDMock[reference.SalesGroup]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.SalesGroup, error) {
			return &reference.SalesGroup{
				Base:           model.Base{ID: 1},
				Name:           "Enterprise",
				OrganizationID: helper.Ptr(uint64(99)),
			}, nil
		},
	}
	svc := crm.NewSalesGroupService(teams, nil)

	_, err := svc.Update(context.Background(), 10, &reference.SalesGroup{Base: model.Base{ID: 1}, Name: "X"})
	if !errors.Is(err, crm.ErrSalesGroupNotFound) {
		t.Fatalf("err = %v, want ErrSalesGroupNotFound", err)
	}
}

func TestSalesGroupService_Delete_RejectsForeignOrg(t *testing.T) {
	teams := dao.CRUDMock[reference.SalesGroup]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.SalesGroup, error) {
			return &reference.SalesGroup{
				Base:           model.Base{ID: 1},
				Name:           "Enterprise",
				OrganizationID: helper.Ptr(uint64(99)),
			}, nil
		},
	}
	svc := crm.NewSalesGroupService(teams, nil)

	if err := svc.Delete(context.Background(), 10, 1); !errors.Is(err, crm.ErrSalesGroupNotFound) {
		t.Fatalf("err = %v, want ErrSalesGroupNotFound", err)
	}
}

func TestSalesGroupService_FindInOrg_HidesForeign(t *testing.T) {
	teams := dao.CRUDMock[reference.SalesGroup]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.SalesGroup, error) {
			return &reference.SalesGroup{
				Base:           model.Base{ID: 1},
				Name:           "Enterprise",
				OrganizationID: helper.Ptr(uint64(99)),
			}, nil
		},
	}
	svc := crm.NewSalesGroupService(teams, nil)

	team, err := svc.FindInOrg(context.Background(), 1, 10)
	if err != nil {
		t.Fatal(err)
	}
	if team != nil {
		t.Fatalf("team = %+v, want nil", team)
	}
}
