package handler

import (
	"context"
	"errors"
	"net/http"
	"testing"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/accounting"
	"github.com/jalusw/swantara/apps/service/internal/kernel/amount"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
)

func pdcTestApp(t *testing.T, svc accounting.PdcService) *fiber.App {
	t.Helper()
	h := NewPdcHandler(svc)
	return accountingTestApp(t, true, h.Register)
}

func samplePdcInstrument(state string) *accounting.PdcInstrument {
	journalID := uint64(20)
	return &accounting.PdcInstrument{
		Base:           model.Base{ID: 1},
		OrganizationID: ptrUint64(10),
		ContactID:      5,
		Direction:      accounting.PaymentTypeInbound,
		Amount:         amount.FromInt64(100),
		DueDate:        ptrTime(time.Date(2026, 4, 1, 0, 0, 0, 0, time.UTC)),
		State:          state,
		JournalID:      &journalID,
	}
}

func ptrTime(value time.Time) *time.Time {
	return &value
}

func TestPdcHandlerCreate(t *testing.T) {
	svc := accounting.NewPdcService(
		accounting.PdcInstrumentDAOMock{CRUDMock: dao.CRUDMock[accounting.PdcInstrument]{
			CreateFunc: func(_ context.Context, instrument *accounting.PdcInstrument) (*accounting.PdcInstrument, error) {
				return instrument, nil
			},
		}},
		accounting.PaymentCreatorMock{},
		accounting.TransactionerMock{},
	)
	app := pdcTestApp(t, svc)

	resp, err := doRequest(app, http.MethodPost, "/pdc-instruments/", `{"contact_id":5,"direction":"inbound","amount":100,"due_date":"2026-04-01","journal_id":20}`)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("expected 201, got %d", resp.StatusCode)
	}

	resp, err = doRequest(app, http.MethodPost, "/pdc-instruments/", `{"contact_id":5,"direction":"inbound","amount":100,"due_date":"bad","journal_id":20}`)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("invalid date: expected 422, got %d", resp.StatusCode)
	}

	resp, err = doRequest(app, http.MethodPost, "/pdc-instruments/", `{"contact_id":5,"direction":"sideways","amount":100,"due_date":"2026-04-01","journal_id":20}`)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("invalid direction: expected 422, got %d", resp.StatusCode)
	}

	failing := accounting.NewPdcService(
		accounting.PdcInstrumentDAOMock{CRUDMock: dao.CRUDMock[accounting.PdcInstrument]{
			CreateFunc: func(_ context.Context, _ *accounting.PdcInstrument) (*accounting.PdcInstrument, error) {
				return nil, errors.New("write failed")
			},
		}}, accounting.PaymentCreatorMock{}, accounting.TransactionerMock{},
	)
	resp, err = doRequest(pdcTestApp(t, failing), http.MethodPost, "/pdc-instruments/", `{"contact_id":5,"direction":"inbound","amount":100,"due_date":"2026-04-01","journal_id":20}`)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("write error: expected 500, got %d", resp.StatusCode)
	}
}

func TestPdcHandlerTransition(t *testing.T) {
	instrument := samplePdcInstrument(accounting.PdcStateHeld)
	svc := accounting.NewPdcService(
		accounting.PdcInstrumentDAOMock{CRUDMock: dao.CRUDMock[accounting.PdcInstrument]{
			FindFunc: func(_ context.Context, _ uint64) (*accounting.PdcInstrument, error) { return instrument, nil },
		}},
		accounting.PaymentCreatorMock{},
		accounting.TransactionerMock{},
	)
	app := pdcTestApp(t, svc)

	resp, err := doRequest(app, http.MethodPost, "/pdc-instruments/1/deposit", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	resp, err = doRequest(app, http.MethodPost, "/pdc-instruments/1/unknown", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("unknown action: expected 404, got %d", resp.StatusCode)
	}

	resp, err = doRequest(app, http.MethodPost, "/pdc-instruments/abc/deposit", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("invalid id: expected 422, got %d", resp.StatusCode)
	}

	resp, err = doRequest(app, http.MethodPost, "/pdc-instruments/1/deposit", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("invalid state: expected 422, got %d", resp.StatusCode)
	}

	missing := accounting.NewPdcService(
		accounting.PdcInstrumentDAOMock{CRUDMock: dao.CRUDMock[accounting.PdcInstrument]{
			FindFunc: func(_ context.Context, _ uint64) (*accounting.PdcInstrument, error) { return nil, nil },
		}}, accounting.PaymentCreatorMock{}, accounting.TransactionerMock{},
	)
	resp, err = doRequest(pdcTestApp(t, missing), http.MethodPost, "/pdc-instruments/1/deposit", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("missing: expected 404, got %d", resp.StatusCode)
	}
}
