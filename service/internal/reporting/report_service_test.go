package reporting

import (
	"context"
	"testing"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/accounting"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
)

func TestReportService_TrialBalance_ReconcilesRows(t *testing.T) {
	ctx := context.Background()
	start := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(2026, 1, 31, 0, 0, 0, 0, time.UTC)

	trialBalances := accounting.NewTrialBalanceService(
		accounting.TrialBalanceDAOMock{
			GenerateRowsByPeriodFunc: func(_ context.Context, _ uint64, _, _ time.Time) ([]accounting.TrialBalanceRow, error) {
				return []accounting.TrialBalanceRow{
					{AccountID: 11, Code: "1100", Name: "Cash", AccountType: "asset", OpeningDebit: 100, PeriodDebit: 50, ClosingDebit: 150},
					{AccountID: 12, Code: "4000", Name: "Revenue", AccountType: "income", ClosingCredit: 200},
				}, nil
			},
		},
		accounting.TaxPeriodDAOMock{
			CRUDMock: dao.CRUDMock[accounting.TaxPeriod]{
				FindFunc: func(_ context.Context, _ uint64) (*accounting.TaxPeriod, error) {
					return &accounting.TaxPeriod{
						Base:           model.Base{ID: 7},
						OrganizationID: 1,
						DateStart:      &start,
						DateEnd:        &end,
					}, nil
				},
			},
		},
	)
	svc := NewReportService(ReportDAOMock{}, trialBalances)

	trial, err := svc.TrialBalance(ctx, 1, 7)
	if err != nil {
		t.Fatalf("trial balance failed: %v", err)
	}
	if len(trial.Rows) != 2 {
		t.Fatalf("rows = %d, want 2", len(trial.Rows))
	}
	if trial.Rows[0].OpeningDebit != 100 || trial.Rows[0].ClosingDebit != 150 {
		t.Errorf("row 0 = %+v, want opening 100 closing 150", trial.Rows[0])
	}
}

func TestReportService_TrialBalance_PeriodNotFound(t *testing.T) {
	ctx := context.Background()
	trialBalances := accounting.NewTrialBalanceService(
		accounting.TrialBalanceDAOMock{},
		accounting.TaxPeriodDAOMock{},
	)
	svc := NewReportService(ReportDAOMock{}, trialBalances)

	if _, err := svc.TrialBalance(ctx, 1, 7); err != ErrPeriodNotFound {
		t.Errorf("err = %v, want ErrPeriodNotFound", err)
	}
}
