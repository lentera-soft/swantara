package accounting

import (
	"context"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/jalusw/swantara/apps/service/internal/kernel/amount"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
)

func TestTrialBalanceService_Generate(t *testing.T) {
	ctx := context.Background()
	start := time.Date(2026, 8, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(2026, 8, 31, 0, 0, 0, 0, time.UTC)

	periods := TaxPeriodDAOMock{
		CRUDMock: dao.CRUDMock[TaxPeriod]{FindFunc: func(_ context.Context, id uint64) (*TaxPeriod, error) {
			return &TaxPeriod{
				Base:           model.Base{ID: id},
				OrganizationID: 10,
				DateStart:      &start,
				DateEnd:        &end,
				State:          TaxPeriodStateOpen,
			}, nil
		}},
	}
	tbDAO := TrialBalanceDAOMock{
		GenerateByPeriodFunc: func(_ context.Context, orgID, periodID uint64) ([]TrialBalanceLine, error) {
			return []TrialBalanceLine{
				{AccountID: 1, AccountCode: "1100", AccountName: "Cash", AccountType: "cash", Debit: amount.FromFloat64(5000), Credit: amount.Zero(), Balance: amount.FromFloat64(5000)},
				{AccountID: 2, AccountCode: "4100", AccountName: "Revenue", AccountType: "income", Debit: amount.Zero(), Credit: amount.FromFloat64(3000), Balance: amount.FromFloat64(-3000)},
			}, nil
		},
	}

	svc := NewTrialBalanceService(tbDAO, periods)
	tb, err := svc.Generate(ctx, 10, 1)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(tb.Lines) != 2 {
		t.Fatalf("lines = %d, want 2", len(tb.Lines))
	}
	if !tb.TotalDebit.Equal(amount.FromFloat64(5000)) {
		t.Errorf("total debit = %v, want 5000", tb.TotalDebit)
	}
	if !tb.TotalCredit.Equal(amount.FromFloat64(3000)) {
		t.Errorf("total credit = %v, want 3000", tb.TotalCredit)
	}
	if tb.PeriodID != 1 {
		t.Errorf("period id = %d, want 1", tb.PeriodID)
	}
}

func TestTrialBalanceService_Generate_RejectsWrongOrg(t *testing.T) {
	ctx := context.Background()
	start := time.Date(2026, 8, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(2026, 8, 31, 0, 0, 0, 0, time.UTC)

	periods := TaxPeriodDAOMock{
		CRUDMock: dao.CRUDMock[TaxPeriod]{FindFunc: func(_ context.Context, id uint64) (*TaxPeriod, error) {
			return &TaxPeriod{
				Base:           model.Base{ID: id},
				OrganizationID: 10,
				DateStart:      &start,
				DateEnd:        &end,
				State:          TaxPeriodStateOpen,
			}, nil
		}},
	}
	svc := NewTrialBalanceService(TrialBalanceDAOMock{}, periods)

	_, err := svc.Generate(ctx, 99, 1)
	if err != ErrPeriodNotFound {
		t.Errorf("err = %v, want ErrPeriodNotFound", err)
	}
}

func TestTrialBalanceDAO_GenerateRowsByPeriod(t *testing.T) {
	db, mock := query.NewMockDB(t)
	start := time.Date(2026, 8, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(2026, 8, 31, 0, 0, 0, 0, time.UTC)

	mock.ExpectQuery("SELECT").WillReturnRows(sqlmock.NewRows([]string{
		"account_id", "code", "name", "account_type",
		"opening_debit", "opening_credit", "period_debit", "period_credit", "closing_debit", "closing_credit",
	}).AddRow(11, "1100", "Cash", "asset", 100, 0, 50, 0, 150, 0))

	rows, err := NewTrialBalanceDAO(db).GenerateRowsByPeriod(context.Background(), 1, start, end)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(rows) != 1 || rows[0].AccountID != 11 || rows[0].ClosingDebit != 150 {
		t.Errorf("rows = %+v, want one closing debit row", rows)
	}

	query.AssertDBMockDone(t, mock)
}

func TestTrialBalanceService_GenerateDetailed(t *testing.T) {
	ctx := context.Background()
	start := time.Date(2026, 8, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(2026, 8, 31, 0, 0, 0, 0, time.UTC)

	periods := TaxPeriodDAOMock{
		CRUDMock: dao.CRUDMock[TaxPeriod]{FindFunc: func(_ context.Context, id uint64) (*TaxPeriod, error) {
			return &TaxPeriod{
				Base:           model.Base{ID: id},
				OrganizationID: 10,
				DateStart:      &start,
				DateEnd:        &end,
				State:          TaxPeriodStateOpen,
			}, nil
		}},
	}
	trialBalances := TrialBalanceDAOMock{
		GenerateRowsByPeriodFunc: func(_ context.Context, orgID uint64, gotStart, gotEnd time.Time) ([]TrialBalanceRow, error) {
			if orgID != 10 || !gotStart.Equal(start) || !gotEnd.Equal(end) {
				t.Errorf("unexpected args org=%d start=%v end=%v", orgID, gotStart, gotEnd)
			}
			return []TrialBalanceRow{{AccountID: 11, Code: "1100", OpeningDebit: 100, ClosingDebit: 150}}, nil
		},
	}

	svc := NewTrialBalanceService(trialBalances, periods)

	got, err := svc.GenerateDetailed(ctx, 10, 1)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.PeriodID != 1 || !got.Start.Equal(start) || !got.End.Equal(end) {
		t.Errorf("detail = %+v, want period 1 with dates", got)
	}
	if len(got.Rows) != 1 || got.Rows[0].ClosingDebit != 150 {
		t.Errorf("rows = %+v, want one closing debit row", got.Rows)
	}

	if _, err := svc.GenerateDetailed(ctx, 99, 1); err != ErrPeriodNotFound {
		t.Errorf("err = %v, want ErrPeriodNotFound", err)
	}
}
