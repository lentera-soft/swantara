package accounting

import "testing"

func TestGenericClassifier(t *testing.T) {
	classifier := GenericClassifier{}
	tests := []struct {
		name         string
		accountType  string
		balanceSheet Section
		profitLoss   Section
		cashFlow     string
		cash         bool
		currentAsset bool
		currentLiab  bool
		income       bool
		cogs         bool
		expense      bool
		depreciation bool
	}{
		{"cash", "cash", SectionCurrentAsset, SectionOperatingExpense, CashFlowOperating, true, true, false, false, false, false, false},
		{"bank", "bank", SectionCurrentAsset, SectionOperatingExpense, CashFlowOperating, true, true, false, false, false, false, false},
		{"receivable", "receivable", SectionCurrentAsset, SectionOperatingExpense, CashFlowOperating, false, true, false, false, false, false, false},
		{"current asset", "current_asset", SectionCurrentAsset, SectionOperatingExpense, CashFlowOperating, false, true, false, false, false, false, false},
		{"fixed asset", "fixed_asset", SectionNonCurrentAsset, SectionOperatingExpense, CashFlowInvesting, false, false, false, false, false, false, false},
		{"depreciation", "depreciation", SectionNonCurrentAsset, SectionOperatingExpense, CashFlowInvesting, false, false, false, false, false, false, true},
		{"payable", "payable", SectionCurrentLiability, SectionOperatingExpense, CashFlowOperating, false, false, true, false, false, false, false},
		{"tax", "tax", SectionCurrentLiability, SectionOperatingExpense, CashFlowOperating, false, false, true, false, false, false, false},
		{"liability", "liability", SectionCurrentLiability, SectionOperatingExpense, CashFlowOperating, false, false, true, false, false, false, false},
		{"equity", "equity", SectionEquity, SectionOperatingExpense, CashFlowFinancing, false, false, false, false, false, false, false},
		{"income", "income", SectionEquity, SectionRevenue, CashFlowOperating, false, false, false, true, false, false, false},
		{"cogs", "cogs", SectionEquity, SectionCOGS, CashFlowOperating, false, false, false, false, true, false, false},
		{"expense", "expense", SectionEquity, SectionOperatingExpense, CashFlowOperating, false, false, false, false, false, true, false},
		{"unknown", "other", SectionEquity, SectionOperatingExpense, CashFlowOperating, false, false, false, false, false, false, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := classifier.BalanceSheetSection(tt.accountType); got != tt.balanceSheet {
				t.Errorf("BalanceSheetSection = %q, want %q", got, tt.balanceSheet)
			}
			if got := classifier.ProfitLossSection(tt.accountType); got != tt.profitLoss {
				t.Errorf("ProfitLossSection = %q, want %q", got, tt.profitLoss)
			}
			if got := classifier.CashFlowSection(tt.accountType); got != tt.cashFlow {
				t.Errorf("CashFlowSection = %q, want %q", got, tt.cashFlow)
			}
			if got := classifier.IsCashEquivalent(tt.accountType); got != tt.cash {
				t.Errorf("IsCashEquivalent = %v, want %v", got, tt.cash)
			}
			if got := classifier.IsCurrentAsset(tt.accountType); got != tt.currentAsset {
				t.Errorf("IsCurrentAsset = %v, want %v", got, tt.currentAsset)
			}
			if got := classifier.IsCurrentLiability(tt.accountType); got != tt.currentLiab {
				t.Errorf("IsCurrentLiability = %v, want %v", got, tt.currentLiab)
			}
			if got := classifier.IsIncome(tt.accountType); got != tt.income {
				t.Errorf("IsIncome = %v, want %v", got, tt.income)
			}
			if got := classifier.IsCOGS(tt.accountType); got != tt.cogs {
				t.Errorf("IsCOGS = %v, want %v", got, tt.cogs)
			}
			if got := classifier.IsExpense(tt.accountType); got != tt.expense {
				t.Errorf("IsExpense = %v, want %v", got, tt.expense)
			}
			if got := classifier.IsDepreciation(tt.accountType); got != tt.depreciation {
				t.Errorf("IsDepreciation = %v, want %v", got, tt.depreciation)
			}
		})
	}
}

func TestGenericFormatter_FormatBalanceSheet(t *testing.T) {
	lines := []StatementLine{
		{Name: "Cash", Amount: 100, Section: SectionCurrentAsset},
		{Name: "Equipment", Amount: 200, Section: SectionNonCurrentAsset},
		{Name: "Payables", Amount: 50, Section: SectionCurrentLiability},
		{Name: "Loan", Amount: 25, Section: SectionNonCurrentLiability},
		{Name: "Capital", Amount: 225, Section: SectionEquity},
		{Name: "Ignored", Amount: 999, Section: SectionRevenue},
	}
	got := GenericFormatter{}.FormatBalanceSheet(lines)
	if got.TotalAssets != 300 || got.TotalLiabilities != 75 || got.TotalEquity != 225 {
		t.Fatalf("unexpected totals: %+v", got)
	}
	if len(got.CurrentAssets) != 1 || len(got.NonCurrentAssets) != 1 || len(got.CurrentLiabilities) != 1 || len(got.NonCurrentLiabilities) != 1 || len(got.Equity) != 1 {
		t.Fatalf("unexpected sections: %+v", got)
	}
}

func TestGenericFormatter_FormatProfitLoss(t *testing.T) {
	lines := []StatementLine{
		{Amount: 1000, Section: SectionRevenue},
		{Amount: 400, Section: SectionCOGS},
		{Amount: 100, Section: SectionOperatingExpense},
		{Amount: 20, Section: SectionOtherIncome},
		{Amount: 10, Section: SectionOtherExpense},
		{Amount: 50, Section: SectionTax},
		{Amount: 999, Section: SectionCurrentAsset},
	}
	got := GenericFormatter{}.FormatProfitLoss(lines)
	if got.GrossProfit != 600 {
		t.Errorf("GrossProfit = %v, want 600", got.GrossProfit)
	}
	if got.OperatingIncome != 500 {
		t.Errorf("OperatingIncome = %v, want 500", got.OperatingIncome)
	}
	if got.ProfitBeforeTax != 510 {
		t.Errorf("ProfitBeforeTax = %v, want 510", got.ProfitBeforeTax)
	}
	if got.NetIncome != 460 {
		t.Errorf("NetIncome = %v, want 460", got.NetIncome)
	}
	if len(got.Revenue) != 1 || len(got.COGS) != 1 || len(got.OperatingExpenses) != 1 || len(got.OtherIncome) != 1 || len(got.OtherExpenses) != 1 || len(got.TaxExpense) != 1 {
		t.Fatalf("unexpected sections: %+v", got)
	}
}

func TestGenericFormatter_FormatCashFlow(t *testing.T) {
	lines := []StatementLine{
		{Amount: 100, CashFlowSection: CashFlowOperating},
		{Amount: -30, CashFlowSection: CashFlowInvesting},
		{Amount: 10, CashFlowSection: CashFlowFinancing},
		{Amount: 999, CashFlowSection: "ignored"},
	}
	got := GenericFormatter{}.FormatCashFlow(lines, 500)
	if got.NetChange != 80 {
		t.Errorf("NetChange = %v, want 80", got.NetChange)
	}
	if got.ClosingCash != 580 {
		t.Errorf("ClosingCash = %v, want 580", got.ClosingCash)
	}
	if len(got.Operating) != 1 || len(got.Investing) != 1 || len(got.Financing) != 1 {
		t.Fatalf("unexpected sections: %+v", got)
	}
}
