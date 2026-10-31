package accounting

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"gorm.io/gorm"
)

func fixedBatchNow() time.Time {
	return time.Date(2026, 3, 4, 5, 6, 7, 0, time.UTC)
}

func TestPaymentBatchService_ListAndGet_Extra(t *testing.T) {
	now := fixedBatchNow()
	batch := &PaymentBatch{
		Base:           model.Base{ID: 1},
		OrganizationID: 10,
		JournalID:      20,
		BatchDate:      &now,
		State:          PaymentBatchStateDraft,
	}
	svc := NewPaymentBatchService(
		PaymentBatchDAOMock{CRUDMock: dao.CRUDMock[PaymentBatch]{
			FindFunc: func(_ context.Context, id uint64) (*PaymentBatch, error) {
				if id == 2 {
					return nil, nil
				}
				return batch, nil
			},
			ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[PaymentBatch], error) {
				return &query.Page[PaymentBatch]{Items: []*PaymentBatch{batch}, Count: 1}, nil
			},
		}},
		PaymentBatchLineDAOMock{},
		PaymentDAOMock{},
		JournalResolverMock{},
		TransactionerMock{},
	)

	page, err := svc.List(context.Background(), &query.Query{})
	if err != nil || page.Count != 1 {
		t.Fatalf("List = %v, %v", page, err)
	}
	got, err := svc.Get(context.Background(), 1, 10)
	if err != nil || got != batch {
		t.Fatalf("Get = %v, %v", got, err)
	}
	if _, err := svc.Get(context.Background(), 1, 11); !errors.Is(err, ErrEntryNotFound) {
		t.Fatalf("err = %v, want ErrEntryNotFound", err)
	}
	if _, err := svc.Get(context.Background(), 2, 10); !errors.Is(err, ErrEntryNotFound) {
		t.Fatalf("err = %v, want ErrEntryNotFound", err)
	}
}

func TestPaymentBatchService_Create_Extra(t *testing.T) {
	createdBatch := &PaymentBatch{Base: model.Base{ID: 9}}
	payments := map[uint64]*Payment{
		1: {Base: model.Base{ID: 1}, Amount: 100, State: PaymentStatePosted},
		2: {Base: model.Base{ID: 2}, Amount: 50, State: PaymentStatePosted},
	}
	var savedLines []*PaymentBatchLine
	svc := NewPaymentBatchService(
		PaymentBatchDAOMock{
			CreateTxFunc: func(_ context.Context, _ *gorm.DB, batch *PaymentBatch) (*PaymentBatch, error) {
				if batch.TotalAmount != 150 || batch.PaymentCount != 2 || batch.State != PaymentBatchStateDraft {
					t.Fatalf("unexpected batch: %+v", batch)
				}
				return createdBatch, nil
			},
			CRUDMock: dao.CRUDMock[PaymentBatch]{
				FindFunc: func(_ context.Context, id uint64) (*PaymentBatch, error) {
					if id != 9 {
						t.Fatalf("id = %d", id)
					}
					return createdBatch, nil
				},
			},
		},
		PaymentBatchLineDAOMock{
			CreateBatchLinesTxFunc: func(_ context.Context, _ *gorm.DB, lines []*PaymentBatchLine, batchID uint64) error {
				if batchID != 9 {
					t.Fatalf("batchID = %d", batchID)
				}
				savedLines = lines
				return nil
			},
		},
		PaymentDAOMock{CRUDMock: dao.CRUDMock[Payment]{
			FindFunc: func(_ context.Context, id uint64) (*Payment, error) { return payments[id], nil },
		}},
		JournalResolverMock{},
		TransactionerMock{},
	)
	svc.now = fixedBatchNow

	got, err := svc.Create(context.Background(), CreatePaymentBatchRequest{
		OrganizationID: 10,
		JournalID:      20,
		Name:           "March payroll",
		PaymentIDs:     []uint64{1, 2},
	})
	if err != nil || got != createdBatch {
		t.Fatalf("Create = %v, %v", got, err)
	}
	if len(savedLines) != 2 {
		t.Fatalf("saved lines = %d, want 2", len(savedLines))
	}
}

func TestPaymentBatchService_Create_Errors_Extra(t *testing.T) {
	wantErr := errors.New("boom")
	base := func(payments PaymentDAOMock, lines PaymentBatchLineDAOMock, batches PaymentBatchDAOMock) PaymentBatchService {
		return NewPaymentBatchService(batches, lines, payments, JournalResolverMock{}, TransactionerMock{})
	}
	if _, err := base(PaymentDAOMock{}, PaymentBatchLineDAOMock{}, PaymentBatchDAOMock{}).
		Create(context.Background(), CreatePaymentBatchRequest{}); !errors.Is(err, ErrPaymentNoInvoices) {
		t.Fatalf("err = %v, want ErrPaymentNoInvoices", err)
	}
	if _, err := base(
		PaymentDAOMock{CRUDMock: dao.CRUDMock[Payment]{
			FindFunc: func(_ context.Context, _ uint64) (*Payment, error) { return nil, nil },
		}},
		PaymentBatchLineDAOMock{}, PaymentBatchDAOMock{},
	).Create(context.Background(), CreatePaymentBatchRequest{PaymentIDs: []uint64{1}}); !errors.Is(err, ErrPaymentNotFound) {
		t.Fatalf("err = %v, want ErrPaymentNotFound", err)
	}
	if _, err := base(
		PaymentDAOMock{CRUDMock: dao.CRUDMock[Payment]{
			FindFunc: func(_ context.Context, _ uint64) (*Payment, error) {
				return &Payment{State: PaymentStateDraft}, nil
			},
		}},
		PaymentBatchLineDAOMock{}, PaymentBatchDAOMock{},
	).Create(context.Background(), CreatePaymentBatchRequest{PaymentIDs: []uint64{1}}); !errors.Is(err, ErrEntryNotPosted) {
		t.Fatalf("err = %v, want ErrEntryNotPosted", err)
	}
	if _, err := base(
		PaymentDAOMock{CRUDMock: dao.CRUDMock[Payment]{
			FindFunc: func(_ context.Context, _ uint64) (*Payment, error) { return nil, wantErr },
		}},
		PaymentBatchLineDAOMock{}, PaymentBatchDAOMock{},
	).Create(context.Background(), CreatePaymentBatchRequest{PaymentIDs: []uint64{1}}); !errors.Is(err, wantErr) {
		t.Fatalf("err = %v, want %v", err, wantErr)
	}
	if _, err := base(
		PaymentDAOMock{CRUDMock: dao.CRUDMock[Payment]{
			FindFunc: func(_ context.Context, _ uint64) (*Payment, error) {
				return &Payment{State: PaymentStatePosted}, nil
			},
		}},
		PaymentBatchLineDAOMock{},
		PaymentBatchDAOMock{CreateTxFunc: func(_ context.Context, _ *gorm.DB, _ *PaymentBatch) (*PaymentBatch, error) {
			return nil, wantErr
		}},
	).Create(context.Background(), CreatePaymentBatchRequest{PaymentIDs: []uint64{1}}); !errors.Is(err, wantErr) {
		t.Fatalf("err = %v, want %v", err, wantErr)
	}
	created := &PaymentBatch{Base: model.Base{ID: 4}}
	if _, err := base(
		PaymentDAOMock{CRUDMock: dao.CRUDMock[Payment]{
			FindFunc: func(_ context.Context, _ uint64) (*Payment, error) {
				return &Payment{State: PaymentStatePosted}, nil
			},
		}},
		PaymentBatchLineDAOMock{CreateBatchLinesTxFunc: func(_ context.Context, _ *gorm.DB, _ []*PaymentBatchLine, _ uint64) error {
			return wantErr
		}},
		PaymentBatchDAOMock{CreateTxFunc: func(_ context.Context, _ *gorm.DB, _ *PaymentBatch) (*PaymentBatch, error) {
			return created, nil
		}},
	).Create(context.Background(), CreatePaymentBatchRequest{PaymentIDs: []uint64{1}}); !errors.Is(err, wantErr) {
		t.Fatalf("err = %v, want %v", err, wantErr)
	}
	if _, err := base(
		PaymentDAOMock{CRUDMock: dao.CRUDMock[Payment]{
			FindFunc: func(_ context.Context, _ uint64) (*Payment, error) {
				return &Payment{State: PaymentStatePosted}, nil
			},
		}},
		PaymentBatchLineDAOMock{},
		PaymentBatchDAOMock{
			CreateTxFunc: func(_ context.Context, _ *gorm.DB, _ *PaymentBatch) (*PaymentBatch, error) {
				return created, nil
			},
			CRUDMock: dao.CRUDMock[PaymentBatch]{
				FindFunc: func(_ context.Context, _ uint64) (*PaymentBatch, error) { return nil, wantErr },
			},
		},
	).Create(context.Background(), CreatePaymentBatchRequest{PaymentIDs: []uint64{1}}); !errors.Is(err, wantErr) {
		t.Fatalf("err = %v, want %v", err, wantErr)
	}
}

func TestPaymentBatchService_GenerateSEPA_Extra(t *testing.T) {
	now := fixedBatchNow()
	batch := &PaymentBatch{
		Base:           model.Base{ID: 7},
		OrganizationID: 10,
		JournalID:      20,
		TotalAmount:    150,
		PaymentCount:   2,
		State:          PaymentBatchStateDraft,
		BatchDate:      &now,
	}
	lines := []*PaymentBatchLine{
		{Base: model.Base{ID: 1}, PaymentID: 1},
		{Base: model.Base{ID: 2}, PaymentID: 2},
	}
	payments := map[uint64]*Payment{
		1: {Base: model.Base{ID: 1}, Amount: 100},
		2: {Base: model.Base{ID: 2}, Amount: 50},
	}
	var updated *PaymentBatch
	svc := NewPaymentBatchService(
		PaymentBatchDAOMock{
			CRUDMock: dao.CRUDMock[PaymentBatch]{
				FindFunc: func(_ context.Context, _ uint64) (*PaymentBatch, error) { return batch, nil },
				UpdateFunc: func(_ context.Context, b *PaymentBatch) (*PaymentBatch, error) {
					updated = b
					return b, nil
				},
			},
		},
		PaymentBatchLineDAOMock{ListByBatchFunc: func(_ context.Context, _ uint64) ([]*PaymentBatchLine, error) {
			return lines, nil
		}},
		PaymentDAOMock{CRUDMock: dao.CRUDMock[Payment]{
			FindFunc: func(_ context.Context, id uint64) (*Payment, error) { return payments[id], nil },
		}},
		JournalResolverMock{},
		TransactionerMock{},
	)
	svc.now = fixedBatchNow

	xml, err := svc.GenerateSEPA(context.Background(), 7, 10)
	if err != nil {
		t.Fatalf("GenerateSEPA error: %v", err)
	}
	for _, want := range []string{"BATCH/7", "PMT/7", "2026-03-04", "100.00", "50.00", "TX/1", "TX/2"} {
		if !strings.Contains(xml, want) {
			t.Fatalf("xml missing %q: %s", want, xml)
		}
	}
	if updated == nil || updated.State != PaymentBatchStateConfirmed || updated.GeneratedAt == nil {
		t.Fatalf("batch not confirmed: %+v", updated)
	}
}

func TestPaymentBatchService_GenerateSEPA_Errors_Extra(t *testing.T) {
	wantErr := errors.New("boom")
	svc := func(batches PaymentBatchDAOMock, lines PaymentBatchLineDAOMock, payments PaymentDAOMock) PaymentBatchService {
		return NewPaymentBatchService(batches, lines, payments, JournalResolverMock{}, TransactionerMock{})
	}
	if _, err := svc(
		PaymentBatchDAOMock{CRUDMock: dao.CRUDMock[PaymentBatch]{
			FindFunc: func(_ context.Context, _ uint64) (*PaymentBatch, error) { return nil, nil },
		}}, PaymentBatchLineDAOMock{}, PaymentDAOMock{},
	).GenerateSEPA(context.Background(), 1, 10); !errors.Is(err, ErrEntryNotFound) {
		t.Fatalf("err = %v, want ErrEntryNotFound", err)
	}
	if _, err := svc(
		PaymentBatchDAOMock{CRUDMock: dao.CRUDMock[PaymentBatch]{
			FindFunc: func(_ context.Context, _ uint64) (*PaymentBatch, error) {
				return &PaymentBatch{OrganizationID: 11, State: PaymentBatchStateDraft}, nil
			},
		}}, PaymentBatchLineDAOMock{}, PaymentDAOMock{},
	).GenerateSEPA(context.Background(), 1, 10); !errors.Is(err, ErrEntryNotFound) {
		t.Fatalf("err = %v, want ErrEntryNotFound", err)
	}
	if _, err := svc(
		PaymentBatchDAOMock{CRUDMock: dao.CRUDMock[PaymentBatch]{
			FindFunc: func(_ context.Context, _ uint64) (*PaymentBatch, error) {
				return &PaymentBatch{OrganizationID: 10, State: PaymentBatchStateConfirmed}, nil
			},
		}}, PaymentBatchLineDAOMock{}, PaymentDAOMock{},
	).GenerateSEPA(context.Background(), 1, 10); !errors.Is(err, ErrInvalidPeriodState) {
		t.Fatalf("err = %v, want ErrInvalidPeriodState", err)
	}
	if _, err := svc(
		PaymentBatchDAOMock{CRUDMock: dao.CRUDMock[PaymentBatch]{
			FindFunc: func(_ context.Context, _ uint64) (*PaymentBatch, error) {
				return &PaymentBatch{OrganizationID: 10, State: PaymentBatchStateDraft}, nil
			},
		}},
		PaymentBatchLineDAOMock{ListByBatchFunc: func(_ context.Context, _ uint64) ([]*PaymentBatchLine, error) {
			return nil, wantErr
		}}, PaymentDAOMock{},
	).GenerateSEPA(context.Background(), 1, 10); !errors.Is(err, wantErr) {
		t.Fatalf("err = %v, want %v", err, wantErr)
	}
	if _, err := svc(
		PaymentBatchDAOMock{CRUDMock: dao.CRUDMock[PaymentBatch]{
			FindFunc: func(_ context.Context, _ uint64) (*PaymentBatch, error) {
				return &PaymentBatch{OrganizationID: 10, State: PaymentBatchStateDraft}, nil
			},
		}},
		PaymentBatchLineDAOMock{ListByBatchFunc: func(_ context.Context, _ uint64) ([]*PaymentBatchLine, error) {
			return []*PaymentBatchLine{{PaymentID: 1}}, nil
		}},
		PaymentDAOMock{CRUDMock: dao.CRUDMock[Payment]{
			FindFunc: func(_ context.Context, _ uint64) (*Payment, error) { return nil, wantErr },
		}},
	).GenerateSEPA(context.Background(), 1, 10); !errors.Is(err, wantErr) {
		t.Fatalf("err = %v, want %v", err, wantErr)
	}
	if _, err := svc(
		PaymentBatchDAOMock{CRUDMock: dao.CRUDMock[PaymentBatch]{
			FindFunc: func(_ context.Context, _ uint64) (*PaymentBatch, error) {
				return &PaymentBatch{OrganizationID: 10, State: PaymentBatchStateDraft}, nil
			},
			UpdateFunc: func(_ context.Context, _ *PaymentBatch) (*PaymentBatch, error) { return nil, wantErr },
		}},
		PaymentBatchLineDAOMock{}, PaymentDAOMock{},
	).GenerateSEPA(context.Background(), 1, 10); !errors.Is(err, wantErr) {
		t.Fatalf("err = %v, want %v", err, wantErr)
	}
}

func TestPaymentBatchService_ListPayments_Extra(t *testing.T) {
	line := &PaymentBatchLine{Base: model.Base{ID: 1}}
	svc := NewPaymentBatchService(
		PaymentBatchDAOMock{},
		PaymentBatchLineDAOMock{ListByBatchFunc: func(_ context.Context, _ uint64) ([]*PaymentBatchLine, error) {
			return []*PaymentBatchLine{line}, nil
		}},
		PaymentDAOMock{},
		JournalResolverMock{},
		TransactionerMock{},
	)
	lines, err := svc.ListPayments(context.Background(), 1)
	if err != nil || len(lines) != 1 || lines[0] != line {
		t.Fatalf("ListPayments = %v, %v", lines, err)
	}
}
