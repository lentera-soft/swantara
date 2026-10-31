package seeders

import "strings"

type hrSeed struct {
	Departments  []string          `json:"departments"`
	JobPositions []jobPositionSeed `json:"job_positions"`
	LeaveTypes   []leaveTypeSeed   `json:"leave_types"`
	SalaryRules  []salaryRuleSeed  `json:"salary_rules"`
}

type jobPositionSeed struct {
	Name       string `json:"name"`
	Department string `json:"department"`
}

type leaveTypeSeed struct {
	Name           string  `json:"name"`
	Paid           bool    `json:"paid"`
	AllocationDays float64 `json:"allocation_days"`
}

type salaryRuleSeed struct {
	Code          string  `json:"code"`
	Name          string  `json:"name"`
	Category      string  `json:"category"`
	ComputeType   string  `json:"compute_type"`
	Amount        float64 `json:"amount"`
	DebitAccount  string  `json:"debit_account"`
	CreditAccount string  `json:"credit_account"`
}

func loadHRSeed(languages ...string) (*hrSeed, error) {
	language := "en"
	if len(languages) > 0 {
		language = normalizeSeedLanguage(languages[0])
	}
	return loadSeedData[hrSeed]("data/hr." + language + ".json")
}

func normalizeSeedLanguage(language string) string {
	value := strings.ToLower(strings.TrimSpace(language))
	switch {
	case value == "id", value == "in", value == "bahasa", value == "bahasa indonesia", strings.HasPrefix(value, "id-"):
		return "id"
	default:
		return "en"
	}
}
