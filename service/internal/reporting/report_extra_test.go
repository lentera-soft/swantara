package reporting

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/accounting"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

func TestReportService_TrialBalance_Errors(t *testing.T) {
	ctx := context.Background()
	dbErr := errors.New("db down")
	start := time.Now()
	end := start.AddDate(0, 1, 0)

	periodDAO := func(p *accounting.TaxPeriod, err error) accounting.TaxPeriodDAOMock {
		return accounting.TaxPeriodDAOMock{
			CRUDMock: dao.CRUDMock[accounting.TaxPeriod]{
				FindFunc: func(_ context.Context, _ uint64) (*accounting.TaxPeriod, error) { return p, err },
			},
		}
	}

	t.Run("period lookup error", func(t *testing.T) {
		svc := NewReportService(ReportDAOMock{}, accounting.NewTrialBalanceService(accounting.TrialBalanceDAOMock{}, periodDAO(nil, dbErr)))
		_, err := svc.TrialBalance(ctx, 1, 7)
		helper.AssertError(t, err, true, dbErr)
	})

	t.Run("period without dates", func(t *testing.T) {
		svc := NewReportService(ReportDAOMock{}, accounting.NewTrialBalanceService(accounting.TrialBalanceDAOMock{}, periodDAO(&accounting.TaxPeriod{}, nil)))
		_, err := svc.TrialBalance(ctx, 1, 7)
		helper.AssertError(t, err, true, ErrPeriodNotFound)
	})

	t.Run("report read error", func(t *testing.T) {
		svc := NewReportService(ReportDAOMock{}, accounting.NewTrialBalanceService(
			accounting.TrialBalanceDAOMock{
				GenerateRowsByPeriodFunc: func(_ context.Context, _ uint64, _, _ time.Time) ([]accounting.TrialBalanceRow, error) {
					return nil, dbErr
				},
			},
			periodDAO(&accounting.TaxPeriod{OrganizationID: 1, DateStart: &start, DateEnd: &end}, nil),
		))
		_, err := svc.TrialBalance(ctx, 1, 7)
		helper.AssertError(t, err, true, dbErr)
	})
}

func TestReportService_Aging_Valuation(t *testing.T) {
	ctx := context.Background()
	asOf := time.Now()

	t.Run("delegates aging and valuation", func(t *testing.T) {
		svc := NewReportService(ReportDAOMock{
			AgingFn: func(_ context.Context, _ uint64, _ time.Time) ([]AgingRow, error) {
				return []AgingRow{{}}, nil
			},
			InventoryValuationFn: func(_ context.Context, _ uint64) ([]InventoryValueRow, error) {
				return []InventoryValueRow{{}}, nil
			},
		}, accounting.NewTrialBalanceService(accounting.TrialBalanceDAOMock{}, accounting.TaxPeriodDAOMock{}))
		rows, err := svc.AgingReport(ctx, 1, asOf)
		if helper.AssertError(t, err, false, nil) {
			return
		}
		if len(rows) != 1 {
			t.Errorf("rows = %d", len(rows))
		}
		values, err := svc.InventoryValuation(ctx, 1)
		if helper.AssertError(t, err, false, nil) {
			return
		}
		if len(values) != 1 {
			t.Errorf("values = %d", len(values))
		}
	})
}

func TestSetClassifiers(t *testing.T) {
	kpi := KpiService{}.WithClassifier(accounting.GenericClassifier{})
	_ = kpi
	statement := StatementService{}.WithClassifier(accounting.GenericClassifier{}).WithFormatter(accounting.GenericFormatter{})
	_ = statement
}

func TestReportingFixtures_Opts(t *testing.T) {
	if FxRevaluationFixture(func(r *FxRevaluation) *FxRevaluation { return r }) == nil {
		t.Error("revaluation = nil")
	}
	if FxRevaluationLineFixture(func(l *FxRevaluationLine) *FxRevaluationLine { return l }) == nil {
		t.Error("line = nil")
	}
	if AccrualFixture(func(a *Accrual) *Accrual { return a }) == nil {
		t.Error("accrual = nil")
	}
	if AccrualLineFixture(func(l *AccrualLine) *AccrualLine { return l }) == nil {
		t.Error("accrual line = nil")
	}
}
