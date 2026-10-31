package reporting

import (
	"context"
	"errors"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/accounting"
)

type TaxPeriodFinder interface {
	Find(ctx context.Context, id uint64) (*accounting.TaxPeriod, error)
}

type ReportService struct {
	reports       ReportDAO
	trialBalances accounting.TrialBalanceService
}

func NewReportService(reports ReportDAO, trialBalances accounting.TrialBalanceService) ReportService {
	return ReportService{reports: reports, trialBalances: trialBalances}
}

type TrialBalance struct {
	OrganizationID uint64                       `json:"organization_id"`
	PeriodID       uint64                       `json:"period_id"`
	Start          time.Time                    `json:"start"`
	End            time.Time                    `json:"end"`
	Rows           []accounting.TrialBalanceRow `json:"rows"`
}

func (s ReportService) TrialBalance(ctx context.Context, organizationID, periodID uint64) (TrialBalance, error) {
	detailed, err := s.trialBalances.GenerateDetailed(ctx, organizationID, periodID)
	if err != nil {
		if errors.Is(err, accounting.ErrPeriodNotFound) {
			return TrialBalance{}, ErrPeriodNotFound
		}
		return TrialBalance{}, err
	}
	return TrialBalance{
		OrganizationID: organizationID,
		PeriodID:       periodID,
		Start:          detailed.Start,
		End:            detailed.End,
		Rows:           detailed.Rows,
	}, nil
}

func (s ReportService) AgingReport(ctx context.Context, organizationID uint64, asOf time.Time) ([]AgingRow, error) {
	return s.reports.Aging(ctx, organizationID, asOf)
}

func (s ReportService) InventoryValuation(ctx context.Context, organizationID uint64) ([]InventoryValueRow, error) {
	return s.reports.InventoryValuation(ctx, organizationID)
}
