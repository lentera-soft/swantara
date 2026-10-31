package handler

import (
	"context"
	"errors"
	"net/http"
	"testing"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/accounting"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"gorm.io/gorm"
)

func paymentBatchTestApp(t *testing.T, svc accounting.PaymentBatchService) *fiber.App {
	t.Helper()
	h := NewPaymentBatchHandler(svc)
	return accountingTestApp(t, true, h.Register)
}

func samplePaymentBatch() *accounting.PaymentBatch {
	date := time.Date(2026, 3, 4, 0, 0, 0, 0, time.UTC)
	return &accounting.PaymentBatch{
		Base:           model.Base{ID: 1},
		OrganizationID: 10,
		JournalID:      20,
		TotalAmount:    150,
		PaymentCount:   1,
		State:          accounting.PaymentBatchStateDraft,
		BatchDate:      &date,
	}
}

func TestPaymentBatchHandlerListAndGet(t *testing.T) {
	svc := accounting.NewPaymentBatchService(
		accounting.PaymentBatchDAOMock{CRUDMock: dao.CRUDMock[accounting.PaymentBatch]{
			ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[accounting.PaymentBatch], error) {
				return &query.Page[accounting.PaymentBatch]{Items: []*accounting.PaymentBatch{samplePaymentBatch()}, Count: 1}, nil
			},
			FindFunc: func(_ context.Context, id uint64) (*accounting.PaymentBatch, error) {
				if id == 1 {
					return samplePaymentBatch(), nil
				}
				return nil, nil
			},
		}},
		accounting.PaymentBatchLineDAOMock{ListByBatchFunc: func(_ context.Context, _ uint64) ([]*accounting.PaymentBatchLine, error) {
			return []*accounting.PaymentBatchLine{{Base: model.Base{ID: 2}, BatchID: 1, PaymentID: 3}}, nil
		}},
		accounting.PaymentDAOMock{},
		accounting.JournalResolverMock{},
		accounting.TransactionerMock{},
	)
	app := paymentBatchTestApp(t, svc)

	resp, err := doRequest(app, http.MethodGet, "/payment-batches/", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("list: expected 200, got %d", resp.StatusCode)
	}

	resp, err = doRequest(app, http.MethodGet, "/payment-batches/1", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("get: expected 200, got %d", resp.StatusCode)
	}

	resp, err = doRequest(app, http.MethodGet, "/payment-batches/abc", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("invalid id: expected 422, got %d", resp.StatusCode)
	}

	resp, err = doRequest(app, http.MethodGet, "/payment-batches/2", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("missing: expected 404, got %d", resp.StatusCode)
	}

	resp, err = doRequest(app, http.MethodGet, "/payment-batches/?filter=bogus:eq:1", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("bad query: expected 422, got %d", resp.StatusCode)
	}

	failingLines := accounting.NewPaymentBatchService(
		accounting.PaymentBatchDAOMock{CRUDMock: dao.CRUDMock[accounting.PaymentBatch]{
			FindFunc: func(_ context.Context, _ uint64) (*accounting.PaymentBatch, error) { return samplePaymentBatch(), nil },
		}}, accounting.PaymentBatchLineDAOMock{
			ListByBatchFunc: func(_ context.Context, _ uint64) ([]*accounting.PaymentBatchLine, error) {
				return nil, errors.New("lines failed")
			},
		}, accounting.PaymentDAOMock{}, accounting.JournalResolverMock{}, accounting.TransactionerMock{},
	)
	resp, err = doRequest(paymentBatchTestApp(t, failingLines), http.MethodGet, "/payment-batches/1", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("lines error: expected 500, got %d", resp.StatusCode)
	}
}

func TestPaymentBatchHandlerCreate(t *testing.T) {
	svc := accounting.NewPaymentBatchService(
		accounting.PaymentBatchDAOMock{
			CreateTxFunc: func(_ context.Context, _ *gorm.DB, _ *accounting.PaymentBatch) (*accounting.PaymentBatch, error) {
				return samplePaymentBatch(), nil
			},
			CRUDMock: dao.CRUDMock[accounting.PaymentBatch]{
				FindFunc: func(_ context.Context, _ uint64) (*accounting.PaymentBatch, error) {
					return samplePaymentBatch(), nil
				},
			},
		},
		accounting.PaymentBatchLineDAOMock{},
		accounting.PaymentDAOMock{CRUDMock: dao.CRUDMock[accounting.Payment]{
			FindFunc: func(_ context.Context, _ uint64) (*accounting.Payment, error) {
				return &accounting.Payment{Base: model.Base{ID: 1}, Amount: 150, State: accounting.PaymentStatePosted}, nil
			},
		}},
		accounting.JournalResolverMock{}, accounting.TransactionerMock{},
	)
	app := paymentBatchTestApp(t, svc)

	resp, err := doRequest(app, http.MethodPost, "/payment-batches/", `{"journal_id":20,"name":"Payroll","payment_ids":[1]}`)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("expected 201, got %d", resp.StatusCode)
	}

	resp, err = doRequest(app, http.MethodPost, "/payment-batches/", `{"name":"Payroll","payment_ids":[1]}`)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("invalid body: expected 422, got %d", resp.StatusCode)
	}

	resp, err = doRequest(app, http.MethodPost, "/payment-batches/", `{"journal_id":20,"name":"Payroll","date":"bad","payment_ids":[1]}`)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("invalid date: expected 422, got %d", resp.StatusCode)
	}

	missingPayment := accounting.NewPaymentBatchService(
		accounting.PaymentBatchDAOMock{}, accounting.PaymentBatchLineDAOMock{},
		accounting.PaymentDAOMock{}, accounting.JournalResolverMock{}, accounting.TransactionerMock{},
	)
	resp, err = doRequest(paymentBatchTestApp(t, missingPayment), http.MethodPost, "/payment-batches/", `{"journal_id":20,"name":"Payroll","payment_ids":[1]}`)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("missing payment: expected 404, got %d", resp.StatusCode)
	}

	failing := accounting.NewPaymentBatchService(
		accounting.PaymentBatchDAOMock{}, accounting.PaymentBatchLineDAOMock{},
		accounting.PaymentDAOMock{CRUDMock: dao.CRUDMock[accounting.Payment]{
			FindFunc: func(_ context.Context, _ uint64) (*accounting.Payment, error) {
				return &accounting.Payment{State: accounting.PaymentStateDraft}, nil
			},
		}}, accounting.JournalResolverMock{}, accounting.TransactionerMock{},
	)
	resp, err = doRequest(paymentBatchTestApp(t, failing), http.MethodPost, "/payment-batches/", `{"journal_id":20,"name":"Payroll","payment_ids":[1]}`)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusConflict {
		t.Fatalf("unposted payment: expected 409, got %d", resp.StatusCode)
	}
}

func TestPaymentBatchHandlerGenerateSEPA(t *testing.T) {
	batch := samplePaymentBatch()
	svc := accounting.NewPaymentBatchService(
		accounting.PaymentBatchDAOMock{CRUDMock: dao.CRUDMock[accounting.PaymentBatch]{
			FindFunc: func(_ context.Context, _ uint64) (*accounting.PaymentBatch, error) { return batch, nil },
		}},
		accounting.PaymentBatchLineDAOMock{ListByBatchFunc: func(_ context.Context, _ uint64) ([]*accounting.PaymentBatchLine, error) {
			return []*accounting.PaymentBatchLine{{PaymentID: 1}}, nil
		}},
		accounting.PaymentDAOMock{CRUDMock: dao.CRUDMock[accounting.Payment]{
			FindFunc: func(_ context.Context, _ uint64) (*accounting.Payment, error) {
				return &accounting.Payment{Amount: 150}, nil
			},
		}},
		accounting.JournalResolverMock{}, accounting.TransactionerMock{},
	)
	app := paymentBatchTestApp(t, svc)

	resp, err := doRequest(app, http.MethodPost, "/payment-batches/1/generate-sepa", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	resp, err = doRequest(app, http.MethodPost, "/payment-batches/abc/generate-sepa", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("invalid id: expected 422, got %d", resp.StatusCode)
	}

	batch.State = accounting.PaymentBatchStateConfirmed
	resp, err = doRequest(app, http.MethodPost, "/payment-batches/1/generate-sepa", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusConflict {
		t.Fatalf("invalid state: expected 409, got %d", resp.StatusCode)
	}
}
