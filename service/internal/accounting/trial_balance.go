package accounting

import (
	"context"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/kernel/amount"
	"github.com/jalusw/swantara/apps/service/internal/reference"
	"gorm.io/gorm"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type TrialBalanceLine struct {
	AccountID   uint64        `json:"account_id"`
	AccountCode string        `json:"account_code"`
	AccountName string        `json:"account_name"`
	AccountType string        `json:"account_type"`
	Debit       amount.Amount `json:"debit"`
	Credit      amount.Amount `json:"credit"`
	Balance     amount.Amount `json:"balance"`
}

type TrialBalance struct {
	Lines       []TrialBalanceLine `json:"lines"`
	TotalDebit  amount.Amount      `json:"total_debit"`
	TotalCredit amount.Amount      `json:"total_credit"`
	PeriodID    uint64             `json:"period_id"`
	Balanced    bool               `json:"balanced"`
	Difference  amount.Amount      `json:"difference"`
}

type TrialBalanceRow struct {
	AccountID     uint64
	Code          string
	Name          string
	AccountType   string
	OpeningDebit  float64
	OpeningCredit float64
	PeriodDebit   float64
	PeriodCredit  float64
	ClosingDebit  float64
	ClosingCredit float64
}

type TrialBalanceDAO interface {
	GenerateByPeriod(ctx context.Context, organizationID, periodID uint64) ([]TrialBalanceLine, error)
	GenerateAsOf(ctx context.Context, organizationID uint64, asOfDate string, includeZero bool) ([]TrialBalanceLine, error)
	GenerateRowsByPeriod(ctx context.Context, organizationID uint64, start, end time.Time) ([]TrialBalanceRow, error)
}

type trialBalanceDAO struct {
	db *gorm.DB
}

func NewTrialBalanceDAO(db *gorm.DB) TrialBalanceDAO {
	return trialBalanceDAO{db: db}
}

func (d trialBalanceDAO) GenerateByPeriod(ctx context.Context, organizationID, periodID uint64) ([]TrialBalanceLine, error) {
	type row struct {
		AccountID   uint64
		AccountCode string
		AccountName string
		AccountType string
		TotalDebit  float64
		TotalCredit float64
	}

	var period TaxPeriod
	if err := d.db.WithContext(ctx).Where("id = ? AND deleted_at IS NULL", periodID).First(&period).Error; err != nil {
		return nil, err
	}
	if period.DateStart == nil || period.DateEnd == nil {
		return nil, ErrInvalidPeriod
	}

	var rows []row
	err := d.db.WithContext(ctx).
		Table("journal_lines AS l").
		Joins("JOIN journal_entrys AS m ON m.id = l.entry_id").
		Joins("JOIN accounts AS a ON a.id = l.account_id").
		Where("m.organization_id = ? AND m.state = ?", organizationID, EntryStatePosted).
		Where("m.date >= ? AND m.date <= ?", period.DateStart, period.DateEnd).
		Where("m.deleted_at IS NULL AND l.deleted_at IS NULL AND a.deleted_at IS NULL").
		Select(`
			l.account_id,
			a.code AS account_code,
			a.name AS account_name,
			a.type AS account_type,
			COALESCE(SUM(l.debit), 0) AS total_debit,
			COALESCE(SUM(l.credit), 0) AS total_credit
		`).
		Group("l.account_id, a.code, a.name, a.type").
		Order("a.code ASC").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	lines := make([]TrialBalanceLine, len(rows))
	for i, r := range rows {
		debit := amount.FromFloat64(r.TotalDebit)
		credit := amount.FromFloat64(r.TotalCredit)
		lines[i] = TrialBalanceLine{
			AccountID:   r.AccountID,
			AccountCode: r.AccountCode,
			AccountName: r.AccountName,
			AccountType: r.AccountType,
			Debit:       debit,
			Credit:      credit,
			Balance:     debit.Sub(credit),
		}
	}
	return lines, nil
}

func (d trialBalanceDAO) GenerateAsOf(ctx context.Context, organizationID uint64, asOfDate string, includeZero bool) ([]TrialBalanceLine, error) {
	type row struct {
		AccountID   uint64
		AccountCode string
		AccountName string
		AccountType string
		TotalDebit  float64
		TotalCredit float64
	}
	var rows []row
	q := d.db.WithContext(ctx).
		Table("journal_lines AS l").
		Joins("JOIN journal_entrys AS m ON m.id = l.entry_id").
		Joins("JOIN accounts AS a ON a.id = l.account_id").
		Where("m.organization_id = ? AND m.state = ?", organizationID, EntryStatePosted).
		Where("m.date <= ?", asOfDate).
		Where("m.deleted_at IS NULL AND l.deleted_at IS NULL AND a.deleted_at IS NULL").
		Group("l.account_id, a.code, a.name, a.type").
		Order("a.code ASC").
		Select(`
			l.account_id,
			a.code AS account_code,
			a.name AS account_name,
			a.type AS account_type,
			COALESCE(SUM(l.debit), 0) AS total_debit,
			COALESCE(SUM(l.credit), 0) AS total_credit
		`)
	if !includeZero {
		q = q.Having("COALESCE(SUM(l.debit),0) <> 0 OR COALESCE(SUM(l.credit),0) <> 0")
	}
	err := q.Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	lines := make([]TrialBalanceLine, len(rows))
	for i, r := range rows {
		debit := amount.FromFloat64(r.TotalDebit)
		credit := amount.FromFloat64(r.TotalCredit)
		lines[i] = TrialBalanceLine{
			AccountID:   r.AccountID,
			AccountCode: r.AccountCode,
			AccountName: r.AccountName,
			AccountType: r.AccountType,
			Debit:       debit,
			Credit:      credit,
			Balance:     debit.Sub(credit),
		}
	}
	return lines, nil
}

func (d trialBalanceDAO) GenerateRowsByPeriod(ctx context.Context, organizationID uint64, start, end time.Time) ([]TrialBalanceRow, error) {
	rows := []TrialBalanceRow{}
	err := d.db.WithContext(ctx).Raw(`
		SELECT l.account_id,
		       a.code,
		       a.name,
		       a.type AS account_type,
		       COALESCE(SUM(CASE WHEN m.date < ? THEN l.debit END), 0) AS opening_debit,
		       COALESCE(SUM(CASE WHEN m.date < ? THEN l.credit END), 0) AS opening_credit,
		       COALESCE(SUM(CASE WHEN m.date >= ? AND m.date <= ? THEN l.debit END), 0) AS period_debit,
		       COALESCE(SUM(CASE WHEN m.date >= ? AND m.date <= ? THEN l.credit END), 0) AS period_credit,
		       COALESCE(SUM(l.debit), 0) AS closing_debit,
		       COALESCE(SUM(l.credit), 0) AS closing_credit
		FROM journal_lines l
		JOIN journal_entrys m ON m.id = l.entry_id
		JOIN accounts a ON a.id = l.account_id
		WHERE m.organization_id = ? AND m.state = 'posted' AND m.date <= ? AND m.deleted_at IS NULL AND a.deleted_at IS NULL
		GROUP BY l.account_id, a.code, a.name, a.type
		ORDER BY a.code`, start, start, start, end, start, end, organizationID, end).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	return rows, nil
}

type DetailedTrialBalance struct {
	PeriodID uint64
	Start    time.Time
	End      time.Time
	Rows     []TrialBalanceRow
}

type TrialBalanceService struct {
	trialBalances TrialBalanceDAO
	periods       TaxPeriodDAO
	accounts      AccountLookup
}

func NewTrialBalanceService(trialBalances TrialBalanceDAO, periods TaxPeriodDAO) TrialBalanceService {
	return TrialBalanceService{trialBalances: trialBalances, periods: periods}
}

func (s TrialBalanceService) WithAccounts(accounts AccountLookup) TrialBalanceService {
	s.accounts = accounts
	return s
}

func (s TrialBalanceService) Generate(ctx context.Context, organizationID, periodID uint64) (*TrialBalance, error) {
	period, err := s.periods.Find(ctx, periodID)
	if err != nil {
		return nil, dao.NotFound(err, ErrPeriodNotFound)
	}
	if period == nil || period.OrganizationID != organizationID {
		return nil, ErrPeriodNotFound
	}

	lines, err := s.trialBalances.GenerateByPeriod(ctx, organizationID, periodID)
	if err != nil {
		return nil, err
	}

	totalDebit := amount.Zero()
	totalCredit := amount.Zero()
	for _, line := range lines {
		totalDebit = totalDebit.Add(line.Debit)
		totalCredit = totalCredit.Add(line.Credit)
	}

	return &TrialBalance{
		Lines:       lines,
		TotalDebit:  totalDebit,
		TotalCredit: totalCredit,
		PeriodID:    periodID,
		Balanced:    amount.IsBalanced(totalDebit, totalCredit, 2),
		Difference:  totalDebit.Sub(totalCredit).Round(4),
	}, nil
}

func (s TrialBalanceService) GenerateDetailed(ctx context.Context, organizationID, periodID uint64) (*DetailedTrialBalance, error) {
	period, err := s.periods.Find(ctx, periodID)
	if err != nil {
		return nil, dao.NotFound(err, ErrPeriodNotFound)
	}
	if period == nil || period.OrganizationID != organizationID || period.DateStart == nil || period.DateEnd == nil {
		return nil, ErrPeriodNotFound
	}

	rows, err := s.trialBalances.GenerateRowsByPeriod(ctx, organizationID, *period.DateStart, *period.DateEnd)
	if err != nil {
		return nil, err
	}
	return &DetailedTrialBalance{
		PeriodID: periodID,
		Start:    *period.DateStart,
		End:      *period.DateEnd,
		Rows:     rows,
	}, nil
}

func (s TrialBalanceService) Rollup(ctx context.Context, organizationID uint64, lines []TrialBalanceLine) ([]TrialBalanceLine, error) {
	if s.accounts == nil {
		return lines, nil
	}
	page, err := s.accounts.List(ctx, nil)
	if err != nil {
		return nil, err
	}
	orgAccounts := make([]*reference.Account, 0, len(page.Items))
	for _, acc := range page.Items {
		if acc.OrganizationID == organizationID {
			orgAccounts = append(orgAccounts, acc)
		}
	}
	return RollupTrialBalance(lines, orgAccounts), nil
}

func (s TrialBalanceService) GenerateAsOf(ctx context.Context, organizationID uint64, asOfDate string, includeZero bool) (*TrialBalance, error) {
	lines, err := s.trialBalances.GenerateAsOf(ctx, organizationID, asOfDate, includeZero)
	if err != nil {
		return nil, err
	}
	totalDebit := amount.Zero()
	totalCredit := amount.Zero()
	for _, line := range lines {
		totalDebit = totalDebit.Add(line.Debit)
		totalCredit = totalCredit.Add(line.Credit)
	}
	return &TrialBalance{
		Lines:       lines,
		TotalDebit:  totalDebit,
		TotalCredit: totalCredit,
		Balanced:    amount.IsBalanced(totalDebit, totalCredit, 2),
		Difference:  totalDebit.Sub(totalCredit).Round(4),
	}, nil
}
