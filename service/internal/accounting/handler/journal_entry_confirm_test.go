package handler

import (
	"context"
	"net/http"
	"testing"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/accounting"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
)

func TestJournalEntryHandlerConfirm(t *testing.T) {
	entry := &accounting.JournalEntry{
		Base:           model.Base{ID: 1},
		OrganizationID: 10,
		JournalID:      1,
		Date:           time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC),
		State:          accounting.EntryStateDraft,
	}
	movements := accounting.JournalEntryDAOMock{CRUDMock: dao.CRUDMock[accounting.JournalEntry]{
		FindFunc: func(_ context.Context, _ uint64) (*accounting.JournalEntry, error) { return entry, nil },
		UpdateFunc: func(_ context.Context, e *accounting.JournalEntry) (*accounting.JournalEntry, error) {
			return e, nil
		},
	}}
	app := journalEntryTestApp(t, true, movements, accounting.JournalLineDAOMock{})

	resp, err := doRequest(app, http.MethodPost, "/journal-entries/1/confirm", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	resp, err = doRequest(app, http.MethodPost, "/journal-entries/abc/confirm", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("invalid id: expected 422, got %d", resp.StatusCode)
	}

	unauthorized := journalEntryTestApp(t, false, movements, accounting.JournalLineDAOMock{})
	resp, err = doRequest(unauthorized, http.MethodPost, "/journal-entries/1/confirm", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("unauthorized: expected 401, got %d", resp.StatusCode)
	}
}
