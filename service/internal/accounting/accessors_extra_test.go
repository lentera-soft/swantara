package accounting

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"gorm.io/gorm"
)

func TestBankStatementService_Accessors_Extra(t *testing.T) {
	statement := &BankStatement{Base: model.Base{ID: 3}}
	line := &BankStatementLine{Base: model.Base{ID: 4}}
	svc := NewBankStatementService(
		BankStatementDAOMock{CRUDMock: dao.CRUDMock[BankStatement]{
			FindFunc: func(_ context.Context, _ uint64) (*BankStatement, error) { return statement, nil },
			ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[BankStatement], error) {
				return &query.Page[BankStatement]{Items: []*BankStatement{statement}, Count: 1}, nil
			},
		}},
		BankStatementLineDAOMock{
			ListByStatementFunc: func(_ context.Context, _ uint64) ([]*BankStatementLine, error) {
				return []*BankStatementLine{line}, nil
			},
		},
		PaymentDAOMock{},
		nil,
		TransactionerMock{},
	)

	got, err := svc.Find(context.Background(), 3)
	if err != nil || got != statement {
		t.Fatalf("Find = %v, %v", got, err)
	}
	page, err := svc.List(context.Background(), &query.Query{})
	if err != nil || page.Count != 1 {
		t.Fatalf("List = %v, %v", page, err)
	}
	lines, err := svc.ListLines(context.Background(), 3)
	if err != nil || len(lines) != 1 || lines[0] != line {
		t.Fatalf("ListLines = %v, %v", lines, err)
	}
}

func TestBudgetService_Accessors_Extra(t *testing.T) {
	start := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(2026, 12, 31, 0, 0, 0, 0, time.UTC)
	orgID := uint64(10)
	budget := &Budget{
		Base:           model.Base{ID: 1},
		OrganizationID: &orgID,
		DateStart:      &start,
		DateEnd:        &end,
	}
	line := &BudgetLine{Base: model.Base{ID: 2}, BudgetID: 1, AccountID: 7, PlannedAmount: 100}
	svc := NewBudgetService(
		BudgetDAOMock{CRUDMock: dao.CRUDMock[Budget]{
			FindFunc: func(_ context.Context, _ uint64) (*Budget, error) { return budget, nil },
			ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[Budget], error) {
				return &query.Page[Budget]{Items: []*Budget{budget}, Count: 1}, nil
			},
		}},
		BudgetLineDAOMock{
			ListByBudgetFunc: func(_ context.Context, _ uint64) ([]*BudgetLine, error) {
				return []*BudgetLine{line}, nil
			},
		},
		BudgetQueryDAOMock{
			SumPracticalByPeriodFunc: func(_ context.Context, _ uint64, _ uint64, _, _ time.Time) (float64, error) {
				return 75, nil
			},
		},
		TransactionerMock{},
	)

	got, err := svc.Find(context.Background(), 1)
	if err != nil || got != budget {
		t.Fatalf("Find = %v, %v", got, err)
	}
	page, err := svc.List(context.Background(), &query.Query{})
	if err != nil || page.Count != 1 {
		t.Fatalf("List = %v, %v", page, err)
	}
	lines, err := svc.ListLines(context.Background(), 1)
	if err != nil || len(lines) != 1 {
		t.Fatalf("ListLines = %v, %v", lines, err)
	}
	variance, err := svc.Variance(context.Background(), 1)
	if err != nil {
		t.Fatalf("Variance error: %v", err)
	}
	if len(variance) != 1 || variance[0].Variance != -25 {
		t.Fatalf("unexpected variance: %+v", variance)
	}
}

func TestBudgetService_Variance_NotFound_Extra(t *testing.T) {
	svc := NewBudgetService(BudgetDAOMock{}, BudgetLineDAOMock{}, BudgetQueryDAOMock{}, TransactionerMock{})
	if _, err := svc.Variance(context.Background(), 1); !errors.Is(err, ErrBudgetNotFound) {
		t.Fatalf("err = %v, want ErrBudgetNotFound", err)
	}
}

func TestBudgetService_Variance_PropagatesErrors_Extra(t *testing.T) {
	start := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(2026, 12, 31, 0, 0, 0, 0, time.UTC)
	orgID := uint64(10)
	wantErr := errors.New("query failed")
	svc := NewBudgetService(
		BudgetDAOMock{CRUDMock: dao.CRUDMock[Budget]{
			FindFunc: func(_ context.Context, _ uint64) (*Budget, error) {
				return &Budget{OrganizationID: &orgID, DateStart: &start, DateEnd: &end}, nil
			},
		}},
		BudgetLineDAOMock{
			ListByBudgetFunc: func(_ context.Context, _ uint64) ([]*BudgetLine, error) {
				return []*BudgetLine{{AccountID: 7}}, nil
			},
		},
		BudgetQueryDAOMock{
			SumPracticalByPeriodFunc: func(_ context.Context, _, _ uint64, _, _ time.Time) (float64, error) {
				return 0, wantErr
			},
		},
		TransactionerMock{},
	)
	if _, err := svc.Variance(context.Background(), 1); !errors.Is(err, wantErr) {
		t.Fatalf("err = %v, want %v", err, wantErr)
	}
}

func TestTaxRuleResolver_Accessors_Extra(t *testing.T) {
	rule := &TaxRule{Base: model.Base{ID: 1}}
	taxMap := &TaxRuleTaxMap{Base: model.Base{ID: 2}}
	accountMap := &TaxRuleAccountMap{Base: model.Base{ID: 3}}
	resolver := NewTaxRuleResolver(
		TaxRuleDAOMock{CRUDMock: dao.CRUDMock[TaxRule]{
			FindFunc: func(_ context.Context, _ uint64) (*TaxRule, error) { return rule, nil },
			ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[TaxRule], error) {
				return &query.Page[TaxRule]{Items: []*TaxRule{rule}, Count: 1}, nil
			},
		}},
		TaxRuleTaxMapDAOMock{
			ListByPositionFunc: func(_ context.Context, _ uint64) ([]*TaxRuleTaxMap, error) {
				return []*TaxRuleTaxMap{taxMap}, nil
			},
		},
		TaxRuleAccountMapDAOMock{
			ListByPositionFunc: func(_ context.Context, _ uint64) ([]*TaxRuleAccountMap, error) {
				return []*TaxRuleAccountMap{accountMap}, nil
			},
		},
		TransactionerMock{},
	)

	got, err := resolver.Find(context.Background(), 1)
	if err != nil || got != rule {
		t.Fatalf("Find = %v, %v", got, err)
	}
	page, err := resolver.List(context.Background(), &query.Query{})
	if err != nil || page.Count != 1 {
		t.Fatalf("List = %v, %v", page, err)
	}
	taxMaps, err := resolver.ListTaxMaps(context.Background(), 1)
	if err != nil || len(taxMaps) != 1 {
		t.Fatalf("ListTaxMaps = %v, %v", taxMaps, err)
	}
	accountMaps, err := resolver.ListAccountMaps(context.Background(), 1)
	if err != nil || len(accountMaps) != 1 {
		t.Fatalf("ListAccountMaps = %v, %v", accountMaps, err)
	}
}

func TestTaxRuleResolver_Create_Extra(t *testing.T) {
	var created *TaxRule
	resolver := NewTaxRuleResolver(
		TaxRuleDAOMock{
			CreateWithMapsTxFunc: func(_ context.Context, _ *gorm.DB, position *TaxRule, taxMaps []*TaxRuleTaxMap, accountMaps []*TaxRuleAccountMap) (*TaxRule, error) {
				created = position
				if len(taxMaps) != 1 || len(accountMaps) != 1 {
					t.Fatalf("unexpected maps: %d %d", len(taxMaps), len(accountMaps))
				}
				return position, nil
			},
		},
		TaxRuleTaxMapDAOMock{},
		TaxRuleAccountMapDAOMock{},
		TransactionerMock{},
	)
	got, err := resolver.Create(context.Background(), CreateTaxRuleRequest{
		OrganizationID: 10,
		Name:           "Indonesia",
		CountryCode:    "ID",
		AutoApply:      true,
		TaxMaps:        []*TaxRuleTaxMap{{}},
		AccountMaps:    []*TaxRuleAccountMap{{}},
	})
	if err != nil || got != created {
		t.Fatalf("Create = %v, %v", got, err)
	}
	if !created.Active || !created.AutoApply || created.OrganizationID == nil || *created.OrganizationID != 10 {
		t.Fatalf("unexpected created rule: %+v", created)
	}
}

func TestTaxRuleResolver_Create_Error_Extra(t *testing.T) {
	wantErr := errors.New("create failed")
	resolver := NewTaxRuleResolver(
		TaxRuleDAOMock{
			CreateWithMapsTxFunc: func(_ context.Context, _ *gorm.DB, _ *TaxRule, _ []*TaxRuleTaxMap, _ []*TaxRuleAccountMap) (*TaxRule, error) {
				return nil, wantErr
			},
		},
		TaxRuleTaxMapDAOMock{},
		TaxRuleAccountMapDAOMock{},
		TransactionerMock{},
	)
	if _, err := resolver.Create(context.Background(), CreateTaxRuleRequest{}); !errors.Is(err, wantErr) {
		t.Fatalf("err = %v, want %v", err, wantErr)
	}
}

type generalLedgerExtraDAOMock struct {
	lines []GeneralLedgerLine
	err   error
}

func (m generalLedgerExtraDAOMock) ListByAccount(_ context.Context, _, _ uint64, _, _ time.Time) ([]GeneralLedgerLine, error) {
	return m.lines, m.err
}

func TestGeneralLedgerService_Extra(t *testing.T) {
	wantErr := errors.New("ledger failed")
	lines := []GeneralLedgerLine{{LineID: 1}}
	svc := NewGeneralLedgerService(generalLedgerExtraDAOMock{lines: lines})
	got, err := svc.ListByAccount(context.Background(), 10, 1, time.Time{}, time.Time{})
	if err != nil || len(got) != 1 {
		t.Fatalf("ListByAccount = %v, %v", got, err)
	}
	if _, err := svc.ListByAccount(context.Background(), 10, 0, time.Time{}, time.Time{}); !errors.Is(err, ErrInvalidLine) {
		t.Fatalf("err = %v, want ErrInvalidLine", err)
	}
	svc = NewGeneralLedgerService(generalLedgerExtraDAOMock{err: wantErr})
	if _, err := svc.ListByAccount(context.Background(), 10, 1, time.Time{}, time.Time{}); !errors.Is(err, wantErr) {
		t.Fatalf("err = %v, want %v", err, wantErr)
	}
}

func TestPostedMoveChecker_Extra(t *testing.T) {
	wantErr := errors.New("list failed")
	svc := NewPostedMoveChecker(JournalEntryDAOMock{CRUDMock: dao.CRUDMock[JournalEntry]{
		ListFunc: func(_ context.Context, q *query.Query) (*query.Page[JournalEntry], error) {
			if q.Pagination == nil || q.Pagination.Size != 1 || len(q.Filters) != 2 {
				t.Fatalf("unexpected query: %+v", q)
			}
			return &query.Page[JournalEntry]{Count: 2}, nil
		},
	}})
	posted, err := svc.HasPosted(context.Background(), 10)
	if err != nil || !posted {
		t.Fatalf("HasPosted = %v, %v", posted, err)
	}
	svc = NewPostedMoveChecker(JournalEntryDAOMock{CRUDMock: dao.CRUDMock[JournalEntry]{
		ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[JournalEntry], error) {
			return nil, wantErr
		},
	}})
	if _, err := svc.HasPosted(context.Background(), 10); !errors.Is(err, wantErr) {
		t.Fatalf("err = %v, want %v", err, wantErr)
	}
}
