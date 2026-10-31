package handler

import (
	"context"
	"errors"
	"net/http"
	"testing"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/accounting"
	"github.com/jalusw/swantara/apps/service/internal/kernel/amount"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type generalLedgerDAOStub struct {
	lines []accounting.GeneralLedgerLine
	err   error
}

func (s generalLedgerDAOStub) ListByAccount(_ context.Context, _, _ uint64, _, _ time.Time) ([]accounting.GeneralLedgerLine, error) {
	return s.lines, s.err
}

func sampleTrialBalanceLines() []accounting.TrialBalanceLine {
	return []accounting.TrialBalanceLine{
		{AccountID: 1, AccountCode: "100", Debit: amount.FromInt64(100), Credit: amount.Zero(), Balance: amount.FromInt64(100)},
		{AccountID: 2, AccountCode: "200", Debit: amount.Zero(), Credit: amount.FromInt64(100), Balance: amount.FromInt64(-100)},
	}
}

func reportTestPeriod() *accounting.TaxPeriod {
	start := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(2026, 1, 31, 0, 0, 0, 0, time.UTC)
	return &accounting.TaxPeriod{
		Base:           model.Base{ID: 1},
		OrganizationID: 10,
		DateStart:      &start,
		DateEnd:        &end,
	}
}

func reportPeriodDAOMock(period *accounting.TaxPeriod, err error) accounting.TaxPeriodDAOMock {
	return accounting.TaxPeriodDAOMock{CRUDMock: dao.CRUDMock[accounting.TaxPeriod]{
		FindFunc: func(_ context.Context, _ uint64) (*accounting.TaxPeriod, error) { return period, err },
	}}
}

func reportTrialBalanceService() accounting.TrialBalanceService {
	period := reportTestPeriod()
	return accounting.NewTrialBalanceService(
		accounting.TrialBalanceDAOMock{
			GenerateByPeriodFunc: func(_ context.Context, _, _ uint64) ([]accounting.TrialBalanceLine, error) {
				return sampleTrialBalanceLines(), nil
			},
			GenerateAsOfFunc: func(_ context.Context, _ uint64, _ string, _ bool) ([]accounting.TrialBalanceLine, error) {
				return sampleTrialBalanceLines(), nil
			},
		},
		reportPeriodDAOMock(period, nil),
	).WithAccounts(accounting.AccountLookupMock{ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[reference.Account], error) {
		return &query.Page[reference.Account]{Items: []*reference.Account{
			{Base: model.Base{ID: 1}, OrganizationID: 10, Code: "100", Name: "Cash", Type: accounting.AccountTypeCash},
		}}, nil
	}})
}

func TestGeneralLedgerHandler(t *testing.T) {
	app := accountingTestApp(t, true, NewGeneralLedgerHandler(accounting.NewGeneralLedgerService(generalLedgerDAOStub{
		lines: []accounting.GeneralLedgerLine{{LineID: 1}},
	})).Register)
	resp, err := doRequest(app, http.MethodGet, "/general-ledger?account_id=1&from=2026-01-01&to=2026-01-31", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	for _, path := range []string{
		"/general-ledger?from=2026-01-01&to=2026-01-31",
		"/general-ledger?account_id=1",
		"/general-ledger?account_id=1&from=bad&to=2026-01-31",
		"/general-ledger?account_id=1&from=2026-01-31&to=2026-01-01",
	} {
		resp, err := doRequest(app, http.MethodGet, path, "")
		if err != nil {
			t.Fatal(err)
		}
		if resp.StatusCode != http.StatusUnprocessableEntity {
			t.Fatalf("%s: expected 422, got %d", path, resp.StatusCode)
		}
	}

	failing := accountingTestApp(t, true, NewGeneralLedgerHandler(accounting.NewGeneralLedgerService(generalLedgerDAOStub{
		err: errors.New("boom"),
	})).Register)
	resp, err = doRequest(failing, http.MethodGet, "/general-ledger?account_id=1&from=2026-01-01&to=2026-01-31", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", resp.StatusCode)
	}

	unauthorized := accountingTestApp(t, false, NewGeneralLedgerHandler(accounting.NewGeneralLedgerService(generalLedgerDAOStub{})).Register)
	resp, err = doRequest(unauthorized, http.MethodGet, "/general-ledger?account_id=1&from=2026-01-01&to=2026-01-31", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.StatusCode)
	}
}

func TestTrialBalanceHandler(t *testing.T) {
	app := accountingTestApp(t, true, NewTrialBalanceHandler(reportTrialBalanceService()).Register)
	for _, path := range []string{
		"/tax-periods/1/trial-balance",
		"/general-ledger/trial-balance?period_id=1",
		"/general-ledger/trial-balance?as_of=2026-01-31",
		"/general-ledger/trial-balance?period_id=1&rollup=true",
	} {
		resp, err := doRequest(app, http.MethodGet, path, "")
		if err != nil {
			t.Fatal(err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("%s: expected 200, got %d", path, resp.StatusCode)
		}
	}

	notFound := accountingTestApp(t, true, NewTrialBalanceHandler(accounting.NewTrialBalanceService(
		accounting.TrialBalanceDAOMock{}, reportPeriodDAOMock(nil, nil),
	)).Register)
	resp, err := doRequest(notFound, http.MethodGet, "/tax-periods/1/trial-balance", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", resp.StatusCode)
	}

	invalidPeriod := accountingTestApp(t, true, NewTrialBalanceHandler(accounting.NewTrialBalanceService(
		accounting.TrialBalanceDAOMock{GenerateByPeriodFunc: func(_ context.Context, _, _ uint64) ([]accounting.TrialBalanceLine, error) {
			return nil, accounting.ErrInvalidPeriod
		}}, reportPeriodDAOMock(&accounting.TaxPeriod{OrganizationID: 10}, nil),
	)).Register)
	resp, err = doRequest(invalidPeriod, http.MethodGet, "/tax-periods/1/trial-balance", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d", resp.StatusCode)
	}

	for _, path := range []string{"/tax-periods/abc/trial-balance", "/general-ledger/trial-balance?period_id=abc", "/general-ledger/trial-balance"} {
		resp, err := doRequest(app, http.MethodGet, path, "")
		if err != nil {
			t.Fatal(err)
		}
		if resp.StatusCode != http.StatusUnprocessableEntity {
			t.Fatalf("%s: expected 422, got %d", path, resp.StatusCode)
		}
	}

	unauthorized := accountingTestApp(t, false, NewTrialBalanceHandler(reportTrialBalanceService()).Register)
	resp, err = doRequest(unauthorized, http.MethodGet, "/tax-periods/1/trial-balance", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.StatusCode)
	}
}

func TestCashFlowHandler(t *testing.T) {
	svc := accounting.NewCashFlowService(accounting.CashFlowDAOMock{
		GetOpeningCashFunc: func(_ context.Context, _ uint64, _ time.Time) (float64, error) { return 10, nil },
		GenerateByPeriodFunc: func(_ context.Context, _ uint64, _, _ time.Time) ([]accounting.CashFlowLine, error) {
			return []accounting.CashFlowLine{
				{AccountID: 1, CashFlowSection: accounting.CashFlowOperating, Amount: 5},
				{AccountID: 2, CashFlowSection: accounting.CashFlowInvesting, Amount: 3},
			}, nil
		},
	})
	app := accountingTestApp(t, true, NewCashFlowHandler(svc).Register)
	resp, err := doRequest(app, http.MethodGet, "/general-ledger/cash-flow?date_start=2026-01-01&date_end=2026-01-31", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	for _, path := range []string{
		"/general-ledger/cash-flow",
		"/general-ledger/cash-flow?date_start=bad&date_end=2026-01-31",
		"/general-ledger/cash-flow?date_start=2026-01-01&date_end=bad",
	} {
		resp, err := doRequest(app, http.MethodGet, path, "")
		if err != nil {
			t.Fatal(err)
		}
		if path == "/general-ledger/cash-flow" {
			if resp.StatusCode != http.StatusBadRequest {
				t.Fatalf("%s: expected 400, got %d", path, resp.StatusCode)
			}
			continue
		}
		if resp.StatusCode != http.StatusUnprocessableEntity {
			t.Fatalf("%s: expected 422, got %d", path, resp.StatusCode)
		}
	}

	failing := accounting.NewCashFlowService(accounting.CashFlowDAOMock{
		GetOpeningCashFunc: func(_ context.Context, _ uint64, _ time.Time) (float64, error) {
			return 0, accounting.ErrInvalidPeriod
		},
	})
	app = accountingTestApp(t, true, NewCashFlowHandler(failing).Register)
	resp, err = doRequest(app, http.MethodGet, "/general-ledger/cash-flow?date_start=2026-01-01&date_end=2026-01-31", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d", resp.StatusCode)
	}

	unauthorized := accountingTestApp(t, false, NewCashFlowHandler(svc).Register)
	resp, err = doRequest(unauthorized, http.MethodGet, "/general-ledger/cash-flow?date_start=2026-01-01&date_end=2026-01-31", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.StatusCode)
	}
}

func TestEquityHandler(t *testing.T) {
	svc := accounting.NewEquityService(
		accounting.EquityDAOMock{
			OpeningEquityBalanceFunc: func(_ context.Context, _ uint64, _ time.Time) ([]accounting.EquityMovement, error) {
				return []accounting.EquityMovement{{AccountID: 1, Amount: 100}}, nil
			},
			EquityBalancesByPeriodFunc: func(_ context.Context, _ uint64, _, _ time.Time) ([]accounting.EquityMovement, error) {
				return []accounting.EquityMovement{{AccountID: 1, Amount: 10}}, nil
			},
			NetIncomeForPeriodFunc: func(_ context.Context, _ uint64, _, _ time.Time) (float64, error) { return 20, nil },
		},
		reportPeriodDAOMock(reportTestPeriod(), nil),
	)
	app := accountingTestApp(t, true, NewEquityHandler(svc).Register)
	resp, err := doRequest(app, http.MethodGet, "/tax-periods/1/equity", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	resp, err = doRequest(app, http.MethodGet, "/tax-periods/abc/equity", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d", resp.StatusCode)
	}

	notFound := accountingTestApp(t, true, NewEquityHandler(accounting.NewEquityService(
		accounting.EquityDAOMock{}, reportPeriodDAOMock(nil, nil),
	)).Register)
	resp, err = doRequest(notFound, http.MethodGet, "/tax-periods/1/equity", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", resp.StatusCode)
	}

	unauthorized := accountingTestApp(t, false, NewEquityHandler(svc).Register)
	resp, err = doRequest(unauthorized, http.MethodGet, "/tax-periods/1/equity", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.StatusCode)
	}
}

func TestIntegrityHandler(t *testing.T) {
	period := reportTestPeriod()
	svc := accounting.NewReportIntegrityService(
		accounting.TrialBalanceDAOMock{
			GenerateAsOfFunc: func(_ context.Context, _ uint64, _ string, _ bool) ([]accounting.TrialBalanceLine, error) {
				return sampleTrialBalanceLines(), nil
			},
			GenerateByPeriodFunc: func(_ context.Context, _, _ uint64) ([]accounting.TrialBalanceLine, error) {
				return sampleTrialBalanceLines(), nil
			},
		},
		accounting.CashFlowDAOMock{
			GetOpeningCashFunc: func(_ context.Context, _ uint64, _ time.Time) (float64, error) { return 10, nil },
			GenerateByPeriodFunc: func(_ context.Context, _ uint64, _, _ time.Time) ([]accounting.CashFlowLine, error) {
				return []accounting.CashFlowLine{{CashFlowSection: accounting.CashFlowOperating, Amount: 10}}, nil
			},
		},
		accounting.EquityDAOMock{
			OpeningEquityBalanceFunc: func(_ context.Context, _ uint64, _ time.Time) ([]accounting.EquityMovement, error) {
				return []accounting.EquityMovement{{AccountID: 1, Amount: 100}}, nil
			},
			EquityBalancesByPeriodFunc: func(_ context.Context, _ uint64, _, _ time.Time) ([]accounting.EquityMovement, error) {
				return []accounting.EquityMovement{{AccountID: 1, Amount: 10}}, nil
			},
			NetIncomeForPeriodFunc: func(_ context.Context, _ uint64, _, _ time.Time) (float64, error) { return 20, nil },
		},
		reportPeriodDAOMock(period, nil),
		accounting.AccountLookupMock{},
	)
	app := accountingTestApp(t, true, NewIntegrityHandler(svc).Register)
	resp, err := doRequest(app, http.MethodGet, "/general-ledger/integrity?period_id=1", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	for _, path := range []string{"/general-ledger/integrity", "/general-ledger/integrity?period_id=abc", "/general-ledger/integrity?period_id=0"} {
		resp, err := doRequest(app, http.MethodGet, path, "")
		if err != nil {
			t.Fatal(err)
		}
		if resp.StatusCode != http.StatusUnprocessableEntity {
			t.Fatalf("%s: expected 422, got %d", path, resp.StatusCode)
		}
	}

	unauthorized := accountingTestApp(t, false, NewIntegrityHandler(svc).Register)
	resp, err = doRequest(unauthorized, http.MethodGet, "/general-ledger/integrity?period_id=1", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.StatusCode)
	}
}
