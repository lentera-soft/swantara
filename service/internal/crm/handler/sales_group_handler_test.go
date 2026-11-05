package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"testing"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

func sampleTeamWithID(id uint64, orgID uint64, leaderID *uint64) *reference.SalesGroup {
	return &reference.SalesGroup{
		Base:           model.Base{ID: id},
		Name:           "Enterprise",
		LeaderID:       leaderID,
		OrganizationID: helper.Ptr(orgID),
	}
}

func TestSalesGroupHandler_Create_ReturnsCreated(t *testing.T) {
	teams := dao.CRUDMock[reference.SalesGroup]{
		CreateFunc: func(_ context.Context, team *reference.SalesGroup) (*reference.SalesGroup, error) {
			return sampleTeamWithID(2, *team.OrganizationID, team.LeaderID), nil
		},
	}
	app := teamApp(teams, 10)

	resp, err := doRequest(app, http.MethodPost, "/crm/teams", `{"name":"Enterprise"}`)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("status = %d, want 201", resp.StatusCode)
	}
}

func TestSalesGroupHandler_Create_RejectsEmptyName(t *testing.T) {
	teams := dao.CRUDMock[reference.SalesGroup]{
		CreateFunc: func(_ context.Context, _ *reference.SalesGroup) (*reference.SalesGroup, error) {
			t.Fatal("create must not run for an empty name")
			return nil, nil
		},
	}
	app := teamApp(teams, 10)

	resp, err := doRequest(app, http.MethodPost, "/crm/teams", `{"name":"  "}`)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want 422", resp.StatusCode)
	}
}

func TestSalesGroupHandler_Create_ReturnsUnauthorizedWithoutTenant(t *testing.T) {
	teams := dao.CRUDMock[reference.SalesGroup]{}
	app := teamApp(teams, 0)

	resp, err := doRequest(app, http.MethodPost, "/crm/teams", `{"name":"Enterprise"}`)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", resp.StatusCode)
	}
}

func TestSalesGroupHandler_Get_ReturnsTeam(t *testing.T) {
	teams := dao.CRUDMock[reference.SalesGroup]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.SalesGroup, error) {
			return sampleTeamWithID(1, 10, nil), nil
		},
	}
	app := teamApp(teams, 10)

	resp, err := doRequest(app, http.MethodGet, "/crm/teams/1", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
}

func TestSalesGroupHandler_Get_ReturnsNotFoundForOtherOrg(t *testing.T) {
	teams := dao.CRUDMock[reference.SalesGroup]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.SalesGroup, error) {
			return sampleTeamWithID(1, 99, nil), nil
		},
	}
	app := teamApp(teams, 10)

	resp, err := doRequest(app, http.MethodGet, "/crm/teams/1", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", resp.StatusCode)
	}
}

func TestSalesGroupHandler_Get_RejectsInvalidID(t *testing.T) {
	teams := dao.CRUDMock[reference.SalesGroup]{}
	app := teamApp(teams, 10)

	resp, err := doRequest(app, http.MethodGet, "/crm/teams/abc", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want 422", resp.StatusCode)
	}
}

func TestSalesGroupHandler_Update_ReturnsTeam(t *testing.T) {
	teams := dao.CRUDMock[reference.SalesGroup]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.SalesGroup, error) {
			return sampleTeamWithID(1, 10, nil), nil
		},
		UpdateFunc: func(_ context.Context, team *reference.SalesGroup) (*reference.SalesGroup, error) {
			return sampleTeamWithID(team.ID, 10, team.LeaderID), nil
		},
	}
	app := teamApp(teams, 10)

	resp, err := doRequest(app, http.MethodPut, "/crm/teams/1", `{"name":"Enterprise"}`)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
}

func TestSalesGroupHandler_Update_ReturnsNotFoundForOtherOrg(t *testing.T) {
	teams := dao.CRUDMock[reference.SalesGroup]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.SalesGroup, error) {
			return sampleTeamWithID(1, 99, nil), nil
		},
	}
	app := teamApp(teams, 10)

	resp, err := doRequest(app, http.MethodPut, "/crm/teams/1", `{"name":"Enterprise"}`)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", resp.StatusCode)
	}
}

func TestSalesGroupHandler_Delete_ReturnsNoContent(t *testing.T) {
	var deleted uint64
	teams := dao.CRUDMock[reference.SalesGroup]{
		FindFunc: func(_ context.Context, _ uint64) (*reference.SalesGroup, error) {
			return sampleTeamWithID(1, 10, nil), nil
		},
		DeleteFunc: func(_ context.Context, id uint64) error {
			deleted = id
			return nil
		},
	}
	app := teamApp(teams, 10)

	resp, err := doRequest(app, http.MethodDelete, "/crm/teams/1", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusNoContent {
		t.Fatalf("status = %d, want 204", resp.StatusCode)
	}
	if deleted != 1 {
		t.Fatalf("deleted id = %d, want 1", deleted)
	}
}

func TestSalesGroupHandler_List_IncludesTimestamps(t *testing.T) {
	stamped := sampleSalesGroup()
	stamped.CreatedAt = time.Date(2026, 1, 2, 3, 4, 5, 0, time.UTC)
	teams := dao.CRUDMock[reference.SalesGroup]{
		ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[reference.SalesGroup], error) {
			return &query.Page[reference.SalesGroup]{Items: []*reference.SalesGroup{stamped}, Count: 1}, nil
		},
	}
	app := teamApp(teams, 10)

	resp, err := doRequest(app, http.MethodGet, "/crm/teams", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}

	var envelope struct {
		Data struct {
			Teams []SalesGroupResponse `json:"teams"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&envelope); err != nil {
		t.Fatal(err)
	}
	if len(envelope.Data.Teams) != 1 {
		t.Fatalf("teams length = %d, want 1", len(envelope.Data.Teams))
	}
	if envelope.Data.Teams[0].CreatedAt.IsZero() {
		t.Fatalf("created_at expected in payload: %+v", envelope.Data.Teams[0])
	}
}
