package audit

import (
	"context"
	"encoding/json"
	"errors"
	"testing"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
)

func TestService_AppendFillsActorAndTimestamp(t *testing.T) {
	ctx := model.ContextWithActor(context.Background(), 42)
	var captured *Log

	svc := NewAuditLogService(LogDAOMock{
		CreateFunc: func(_ context.Context, entry *Log) (*Log, error) {
			captured = entry
			return entry, nil
		},
	})

	err := svc.Append(ctx, &Log{EntityTable: "sale_orders", RecordID: 7, Action: ActionUpdate, Diff: json.RawMessage(`{"state":"draft"}`)})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if captured.ChangedBy != 42 {
		t.Errorf("expected changed_by 42, got %d", captured.ChangedBy)
	}
	if captured.ChangedAt.IsZero() {
		t.Error("expected changed_at to be filled")
	}
}

func TestService_AppendPreservesExplicitValues(t *testing.T) {
	at := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	var captured *Log

	svc := NewAuditLogService(LogDAOMock{
		CreateFunc: func(_ context.Context, entry *Log) (*Log, error) {
			captured = entry
			return entry, nil
		},
	})

	err := svc.Append(context.Background(), &Log{
		EntityTable: "audit_logs_override",
		RecordID:    1,
		Action:      ActionInsert,
		ChangedBy:   9,
		ChangedAt:   at,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if captured.ChangedBy != 9 || !captured.ChangedAt.Equal(at) {
		t.Errorf("expected explicit values preserved, got %#v", captured)
	}
}

func TestService_AppendPropagatesCreateError(t *testing.T) {
	sentinel := errors.New("db error")
	svc := NewAuditLogService(LogDAOMock{
		CreateFunc: func(_ context.Context, _ *Log) (*Log, error) {
			return nil, sentinel
		},
	})

	err := svc.Append(context.Background(), &Log{EntityTable: "sale_orders", RecordID: 1, Action: ActionInsert})
	if helper.AssertError(t, err, true, sentinel) {
		return
	}
}

func TestRecord_MarshalsDiff(t *testing.T) {
	var captured *Log

	svc := NewAuditLogService(LogDAOMock{
		CreateFunc: func(_ context.Context, entry *Log) (*Log, error) {
			captured = entry
			return entry, nil
		},
	})

	err := Record(context.Background(), svc, "sale_orders", 21, ActionInsert, map[string]any{"code": "SO/0042"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if captured.EntityTable != "sale_orders" || captured.RecordID != 21 || captured.Action != ActionInsert {
		t.Errorf("unexpected entry: %#v", captured)
	}
	var diff map[string]any
	if err := json.Unmarshal(captured.Diff, &diff); err != nil {
		t.Fatalf("invalid diff json: %v", err)
	}
	if diff["code"] != "SO/0042" {
		t.Errorf("unexpected diff: %#v", diff)
	}
}

func TestService_AppendCorrelatesRequestAndOrganization(t *testing.T) {
	ctx := model.ContextWithTenant(model.ContextWithActor(context.Background(), 42), 7)
	ctx = helper.ContextWithRequestID(ctx, "req-audit-1")
	var captured *Log

	svc := NewAuditLogService(LogDAOMock{
		CreateFunc: func(_ context.Context, entry *Log) (*Log, error) {
			captured = entry
			return entry, nil
		},
	})

	if err := svc.Append(ctx, &Log{EntityTable: "sale_orders", RecordID: 9, Action: ActionUpdate}); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if captured.OrganizationID == nil || *captured.OrganizationID != 7 {
		t.Errorf("organization_id = %v, want 7", captured.OrganizationID)
	}
	if captured.RequestID != "req-audit-1" {
		t.Errorf("request_id = %q, want req-audit-1", captured.RequestID)
	}
}

func TestService_AppendPreservesExplicitScope(t *testing.T) {
	ctx := model.ContextWithTenant(context.Background(), 7)
	ctx = helper.ContextWithRequestID(ctx, "req-context")
	organizationID := uint64(3)
	var captured *Log

	svc := NewAuditLogService(LogDAOMock{
		CreateFunc: func(_ context.Context, entry *Log) (*Log, error) {
			captured = entry
			return entry, nil
		},
	})

	if err := svc.Append(ctx, &Log{
		EntityTable:    "sale_orders",
		RecordID:       9,
		OrganizationID: &organizationID,
		RequestID:      "req-explicit",
		Action:         ActionUpdate,
	}); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if captured.OrganizationID == nil || *captured.OrganizationID != 3 {
		t.Errorf("organization_id = %v, want 3", captured.OrganizationID)
	}
	if captured.RequestID != "req-explicit" {
		t.Errorf("request_id = %q, want req-explicit", captured.RequestID)
	}
}

func TestService_ListAndFindInOrg(t *testing.T) {
	organizationID := uint64(4)
	log := &Log{Base: model.Base{ID: 9}, EntityTable: "sale_orders"}
	svc := NewAuditLogService(LogDAOMock{
		ListInOrgFunc: func(_ context.Context, _ *query.Query, org uint64) (*query.Page[Log], error) {
			if org != organizationID {
				t.Errorf("list organization = %d, want %d", org, organizationID)
			}
			return &query.Page[Log]{Items: []*Log{log}, Count: 1}, nil
		},
		FindInOrgFunc: func(_ context.Context, id, org uint64) (*Log, error) {
			if id != 9 || org != organizationID {
				t.Errorf("find id/org = %d/%d, want 9/%d", id, org, organizationID)
			}
			return log, nil
		},
	})

	page, err := svc.ListInOrg(context.Background(), nil, organizationID)
	if err != nil || page.Count != 1 {
		t.Fatalf("ListInOrg = %+v, %v", page, err)
	}
	found, err := svc.FindInOrg(context.Background(), 9, organizationID)
	if err != nil || found != log {
		t.Fatalf("FindInOrg = %+v, %v", found, err)
	}
}

func TestRecordInOrganizationSetsScope(t *testing.T) {
	var captured *Log
	organizationID := uint64(11)
	svc := NewAuditLogService(LogDAOMock{
		CreateFunc: func(_ context.Context, entry *Log) (*Log, error) {
			captured = entry
			return entry, nil
		},
	})

	if err := RecordInOrganization(context.Background(), svc, "sale_orders", 21, ActionInsert, map[string]any{"code": "SO/0042"}, &organizationID); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if captured.OrganizationID == nil || *captured.OrganizationID != organizationID {
		t.Errorf("organization_id = %v, want %d", captured.OrganizationID, organizationID)
	}
}
