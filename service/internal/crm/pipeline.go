package crm

import (
	"context"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/kernel/amount"
	"github.com/jalusw/swantara/apps/service/internal/kernel/clock"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/reference"
	"github.com/jalusw/swantara/apps/service/internal/systemconfig"
)

type PipelineService struct {
	leads   ProspectDAO
	stages  dao.CRUD[reference.PipelineStage]
	history StageHistoryDAO
	users   UserLookup
	configs systemconfig.Lookup
	now     func() time.Time
}

func NewPipelineService(leads ProspectDAO, stages dao.CRUD[reference.PipelineStage]) PipelineService {
	return PipelineService{leads: leads, stages: stages, now: clock.Now}
}

func (s PipelineService) WithClock(now func() time.Time) PipelineService {
	s.now = now
	return s
}

func (s PipelineService) WithConfigs(configs systemconfig.Lookup) PipelineService {
	s.configs = configs
	return s
}

func (s PipelineService) WithStageHistory(history StageHistoryDAO) PipelineService {
	s.history = history
	return s
}

func (s PipelineService) WithUsers(users UserLookup) PipelineService {
	s.users = users
	return s
}

type PipelineStage struct {
	StageID             uint64  `json:"stage_id"`
	StageName           string  `json:"stage_name"`
	Probability         float64 `json:"probability"`
	ExitCriteria        *string `json:"exit_criteria,omitempty"`
	IsWon               bool    `json:"is_won"`
	IsLost              bool    `json:"is_lost"`
	OpportunityCount    int64   `json:"opportunity_count"`
	ExpectedRevenue     float64 `json:"expected_revenue"`
	WeightedRevenue     float64 `json:"weighted_revenue"`
	AverageAgeDays      float64 `json:"average_age_days"`
	AverageVelocityDays float64 `json:"average_velocity_days"`
}

type SourcePerformance struct {
	Source             string  `json:"source"`
	LeadCount          int64   `json:"lead_count"`
	OpportunityCount   int64   `json:"opportunity_count"`
	WonCount           int64   `json:"won_count"`
	LostCount          int64   `json:"lost_count"`
	ExpectedRevenue    float64 `json:"expected_revenue"`
	WonRevenue         float64 `json:"won_revenue"`
	QualifiedCount     int64   `json:"qualified_count"`
	QualificationRate  float64 `json:"qualification_rate"`
	OpportunityWinRate float64 `json:"opportunity_win_rate"`
}

type OwnerPerformance struct {
	OwnerUserID      *uint64 `json:"owner_user_id"`
	OwnerName        string  `json:"owner_name"`
	SalespersonID    *uint64 `json:"salesperson_id"`
	SalesGroupID     *uint64 `json:"sales_group_id"`
	OpportunityCount int64   `json:"opportunity_count"`
	WonCount         int64   `json:"won_count"`
	LostCount        int64   `json:"lost_count"`
	ExpectedRevenue  float64 `json:"expected_revenue"`
	WonRevenue       float64 `json:"won_revenue"`
	WinRate          float64 `json:"win_rate"`
}

type LostReasonCount struct {
	Code   string `json:"code"`
	Reason string `json:"reason"`
	Count  int64  `json:"count"`
}

type LeadFunnel struct {
	Total                        int64   `json:"total"`
	LeadTotal                    int64   `json:"lead_total"`
	OpportunityTotal             int64   `json:"opportunity_total"`
	Won                          int64   `json:"won"`
	Lost                         int64   `json:"lost"`
	New                          int64   `json:"new"`
	Contacted                    int64   `json:"contacted"`
	Qualified                    int64   `json:"qualified"`
	Nurtured                     int64   `json:"nurtured"`
	Disqualified                 int64   `json:"disqualified"`
	Converted                    int64   `json:"converted"`
	QualificationRate            float64 `json:"qualification_rate"`
	ConversionRate               float64 `json:"conversion_rate"`
	AverageResponseHours         float64 `json:"average_response_hours"`
	AverageLeadToOpportunityDays float64 `json:"average_lead_to_opportunity_days"`
	ResponseSLAHours             float64 `json:"response_sla_hours"`
	ResponseSLABreached          int64   `json:"response_sla_breached"`
	ResponseSLAAtRisk            int64   `json:"response_sla_at_risk"`
}

type PipelineForecast struct {
	TotalExpectedRevenue float64             `json:"total_expected_revenue"`
	WeightedPipeline     float64             `json:"weighted_pipeline"`
	WinRate              float64             `json:"win_rate"`
	CommitRevenue        float64             `json:"commit_revenue"`
	BestCaseRevenue      float64             `json:"best_case_revenue"`
	PipelineRevenue      float64             `json:"pipeline_revenue"`
	WeightedCommit       float64             `json:"weighted_commit"`
	WeightedBestCase     float64             `json:"weighted_best_case"`
	WeightedPipelineOnly float64             `json:"weighted_pipeline_only"`
	AverageDealSize      float64             `json:"average_deal_size"`
	AverageSalesCycle    float64             `json:"average_sales_cycle_days"`
	LeadFunnel           LeadFunnel          `json:"lead_funnel"`
	Stages               []PipelineStage     `json:"stages"`
	Sources              []SourcePerformance `json:"sources"`
	Owners               []OwnerPerformance  `json:"owners"`
	LostReasons          []LostReasonCount   `json:"lost_reasons"`
}

func (s PipelineService) Forecast(ctx context.Context, organizationID *uint64) (PipelineForecast, error) {
	parsedQuery := &query.Query{
		Sorts: []query.Sort{{Field: "sequence", Direction: query.Ascending}},
	}
	if organizationID != nil {
		parsedQuery.Filters = []query.Filter{{Field: "organization_id", Operator: query.Equal, Value: *organizationID}}
	}
	page, err := s.stages.List(ctx, parsedQuery)
	if err != nil {
		return PipelineForecast{}, err
	}

	open, err := s.leads.ListOpen(ctx, organizationID)
	if err != nil {
		return PipelineForecast{}, err
	}
	won, err := s.leads.CountWon(ctx, organizationID)
	if err != nil {
		return PipelineForecast{}, err
	}
	lost, err := s.leads.CountLost(ctx, organizationID)
	if err != nil {
		return PipelineForecast{}, err
	}

	all, err := s.leads.List(ctx, scopedQuery(organizationID))
	if err != nil {
		return PipelineForecast{}, err
	}

	now := s.now()
	stages := make([]PipelineStage, 0, len(page.Items))
	index := make(map[uint64]int, len(page.Items))
	for _, stage := range page.Items {
		index[stage.ID] = len(stages)
		stages = append(stages, PipelineStage{
			StageID:      stage.ID,
			StageName:    stage.Name,
			Probability:  stage.Probability,
			ExitCriteria: stage.ExitCriteria,
			IsWon:        stage.IsWon,
			IsLost:       stage.IsLost,
		})
	}

	totalExpected := amount.Zero()
	weighted := amount.Zero()
	weightedCommit := amount.Zero()
	weightedBestCase := amount.Zero()
	weightedPipeline := amount.Zero()
	commit := 0.0
	bestCase := 0.0
	pipelineValue := 0.0
	ageTotals := make(map[uint64]float64, len(stages))
	ageCounts := make(map[uint64]int64, len(stages))

	for _, prospect := range open {
		expected := amount.FromFloat64(prospect.ExpectedRevenue)
		weightedRow, err := weightedAmount(prospect.ExpectedRevenue, prospect.Probability)
		if err != nil {
			return PipelineForecast{}, err
		}
		totalExpected = totalExpected.Add(expected)
		weighted = weighted.Add(weightedRow)

		switch prospect.ForecastCategory {
		case ForecastCategoryCommit:
			commit += prospect.ExpectedRevenue
			weightedCommit = weightedCommit.Add(weightedRow)
		case ForecastCategoryBestCase:
			bestCase += prospect.ExpectedRevenue
			weightedBestCase = weightedBestCase.Add(weightedRow)
		default:
			pipelineValue += prospect.ExpectedRevenue
			weightedPipeline = weightedPipeline.Add(weightedRow)
		}

		if prospect.StageID != nil {
			if idx, ok := index[*prospect.StageID]; ok {
				stages[idx].OpportunityCount++
				stages[idx].ExpectedRevenue += expected.Float64()
				stages[idx].WeightedRevenue += weightedRow.Float64()
				entered := prospect.CreatedAt
				if prospect.StageEnteredAt != nil {
					entered = *prospect.StageEnteredAt
				}
				if !entered.IsZero() {
					ageTotals[*prospect.StageID] += now.Sub(entered).Hours() / 24
					ageCounts[*prospect.StageID]++
				}
			}
		}
	}
	for i := range stages {
		if ageCounts[stages[i].StageID] > 0 {
			stages[i].AverageAgeDays = round2(ageTotals[stages[i].StageID] / float64(ageCounts[stages[i].StageID]))
		}
	}

	if s.history != nil && organizationID != nil {
		history, err := s.history.ListInOrg(ctx, *organizationID)
		if err != nil {
			return PipelineForecast{}, err
		}
		applyStageVelocity(stages, index, history, now)
	}

	slaHours, err := s.leadResponseSLAHours(ctx, organizationID)
	if err != nil {
		return PipelineForecast{}, err
	}
	funnel, sources, owners, reasons := s.breakdowns(ctx, all.Items, now, slaHours)

	forecast := PipelineForecast{
		TotalExpectedRevenue: totalExpected.Round(4).Float64(),
		WeightedPipeline:     weighted.Round(4).Float64(),
		WinRate:              winRate(won, lost),
		CommitRevenue:        round2(commit),
		BestCaseRevenue:      round2(bestCase),
		PipelineRevenue:      round2(pipelineValue),
		WeightedCommit:       weightedCommit.Round(4).Float64(),
		WeightedBestCase:     weightedBestCase.Round(4).Float64(),
		WeightedPipelineOnly: weightedPipeline.Round(4).Float64(),
		AverageDealSize:      averageExpected(open),
		AverageSalesCycle:    averageSalesCycle(all.Items, now),
		LeadFunnel:           funnel,
		Stages:               stages,
		Sources:              sources,
		Owners:               owners,
		LostReasons:          reasons,
	}
	return forecast, nil
}

func (s PipelineService) breakdowns(ctx context.Context, prospects []*Prospect, now time.Time, slaHours float64) (LeadFunnel, []SourcePerformance, []OwnerPerformance, []LostReasonCount) {
	var funnel LeadFunnel
	responseHours := 0.0
	responseCount := int64(0)
	leadToOpportunityDays := 0.0
	leadToOpportunityCount := int64(0)
	sourceMap := map[string]*SourcePerformance{}
	ownerMap := map[string]*OwnerPerformance{}
	reasonMap := map[string]int64{}

	for _, prospect := range prospects {
		if prospect.Type == ProspectKindLead {
			funnel.Total++
			funnel.LeadTotal++
			switch prospect.Status {
			case ProspectStatusNew:
				funnel.New++
			case ProspectStatusContacted:
				funnel.Contacted++
			case ProspectStatusQualified:
				funnel.Qualified++
			case ProspectStatusNurtured:
				funnel.Nurtured++
			case ProspectStatusDisqualified:
				funnel.Disqualified++
			case ProspectStatusConverted:
				funnel.Converted++
			}
			if prospect.FirstContactedAt != nil && !prospect.CreatedAt.IsZero() {
				hours := prospect.FirstContactedAt.Sub(prospect.CreatedAt).Hours()
				responseHours += hours
				responseCount++
				if slaHours > 0 && hours > slaHours {
					funnel.ResponseSLABreached++
				}
			} else if !prospect.CreatedAt.IsZero() && slaHours > 0 {
				age := now.Sub(prospect.CreatedAt).Hours()
				if age > slaHours {
					funnel.ResponseSLABreached++
				} else if age >= slaHours*0.75 {
					funnel.ResponseSLAAtRisk++
				}
			}
		} else {
			funnel.OpportunityTotal++
			switch prospect.Status {
			case ProspectStatusWon:
				funnel.Won++
			case ProspectStatusLost:
				funnel.Lost++
			}
			if prospect.ConvertedAt != nil && !prospect.CreatedAt.IsZero() {
				leadToOpportunityDays += prospect.ConvertedAt.Sub(prospect.CreatedAt).Hours() / 24
				leadToOpportunityCount++
			}
		}

		source := "unknown"
		if prospect.Source != nil && *prospect.Source != "" {
			source = *prospect.Source
		}
		sourceStats := sourceMap[source]
		if sourceStats == nil {
			sourceStats = &SourcePerformance{Source: source}
			sourceMap[source] = sourceStats
		}
		if prospect.Type == ProspectKindLead {
			sourceStats.LeadCount++
			if prospect.Status == ProspectStatusQualified || prospect.Status == ProspectStatusConverted {
				sourceStats.QualifiedCount++
			}
		} else {
			sourceStats.OpportunityCount++
			sourceStats.ExpectedRevenue += prospect.ExpectedRevenue
		}
		if prospect.Status == ProspectStatusWon {
			sourceStats.WonCount++
			sourceStats.WonRevenue += prospect.ExpectedRevenue
		}
		if prospect.Status == ProspectStatusLost || prospect.Status == ProspectStatusDisqualified {
			sourceStats.LostCount++
		}

		ownerKey := ownerKey(prospect)
		ownerStats := ownerMap[ownerKey]
		if ownerStats == nil {
			ownerStats = &OwnerPerformance{
				OwnerUserID:   prospect.OwnerUserID,
				SalespersonID: prospect.SalespersonID,
				SalesGroupID:  prospect.SalesGroupID,
			}
			ownerMap[ownerKey] = ownerStats
		}
		if prospect.Type == ProspectKindOpportunity {
			ownerStats.OpportunityCount++
			ownerStats.ExpectedRevenue += prospect.ExpectedRevenue
		}
		if prospect.Status == ProspectStatusWon {
			ownerStats.WonCount++
			ownerStats.WonRevenue += prospect.ExpectedRevenue
		}
		if prospect.Status == ProspectStatusLost || prospect.Status == ProspectStatusDisqualified {
			ownerStats.LostCount++
		}

		lostCode := valueOrEmpty(prospect.LostReasonCode)
		lostReason := valueOrEmpty(prospect.LostReason)
		if lostCode != "" || lostReason != "" {
			key := lostCode
			if key == "" {
				key = lostReason
			}
			reasonMap[key]++
		}
	}

	if responseCount > 0 {
		funnel.AverageResponseHours = round2(responseHours / float64(responseCount))
	}
	if leadToOpportunityCount > 0 {
		funnel.AverageLeadToOpportunityDays = round2(leadToOpportunityDays / float64(leadToOpportunityCount))
	}
	funnel.ResponseSLAHours = round2(slaHours)
	if funnel.LeadTotal > 0 {
		funnel.QualificationRate = percentage(funnel.Qualified+funnel.Converted, funnel.LeadTotal)
		funnel.ConversionRate = percentage(funnel.OpportunityTotal, funnel.LeadTotal)
	}

	sources := make([]SourcePerformance, 0, len(sourceMap))
	for _, stats := range sourceMap {
		if stats.LeadCount > 0 {
			stats.QualificationRate = percentage(stats.QualifiedCount, stats.LeadCount)
		}
		if stats.WonCount+stats.LostCount > 0 {
			stats.OpportunityWinRate = percentage(stats.WonCount, stats.WonCount+stats.LostCount)
		}
		sources = append(sources, *stats)
	}
	sort.Slice(sources, func(i, j int) bool {
		if sources[i].ExpectedRevenue == sources[j].ExpectedRevenue {
			return sources[i].Source < sources[j].Source
		}
		return sources[i].ExpectedRevenue > sources[j].ExpectedRevenue
	})

	owners := make([]OwnerPerformance, 0, len(ownerMap))
	for _, stats := range ownerMap {
		if stats.WonCount+stats.LostCount > 0 {
			stats.WinRate = percentage(stats.WonCount, stats.WonCount+stats.LostCount)
		}
		owners = append(owners, *stats)
	}
	if s.users != nil {
		for i := range owners {
			if owners[i].OwnerUserID == nil {
				continue
			}
			user, err := s.users.Find(ctx, *owners[i].OwnerUserID)
			if err == nil && user != nil {
				owners[i].OwnerName = strings.TrimSpace(user.FirstName + " " + valueOrEmpty(user.LastName))
			}
		}
	}
	sort.Slice(owners, func(i, j int) bool {
		if owners[i].ExpectedRevenue == owners[j].ExpectedRevenue {
			return ownerKeyValue(&owners[i]) < ownerKeyValue(&owners[j])
		}
		return owners[i].ExpectedRevenue > owners[j].ExpectedRevenue
	})

	reasons := make([]LostReasonCount, 0, len(reasonMap))
	for code, count := range reasonMap {
		reasons = append(reasons, LostReasonCount{Code: code, Reason: code, Count: count})
	}
	sort.Slice(reasons, func(i, j int) bool {
		if reasons[i].Count == reasons[j].Count {
			return reasons[i].Reason < reasons[j].Reason
		}
		return reasons[i].Count > reasons[j].Count
	})
	if len(reasons) > 10 {
		reasons = reasons[:10]
	}

	return funnel, sources, owners, reasons
}

func applyStageVelocity(stages []PipelineStage, index map[uint64]int, history []*ProspectStageHistory, now time.Time) {
	byProspect := make(map[uint64][]*ProspectStageHistory)
	order := make([]uint64, 0)
	for _, entry := range history {
		if _, seen := byProspect[entry.ProspectID]; !seen {
			order = append(order, entry.ProspectID)
		}
		byProspect[entry.ProspectID] = append(byProspect[entry.ProspectID], entry)
	}
	totals := make(map[uint64]float64)
	counts := make(map[uint64]int64)
	for _, prospectID := range order {
		entries := byProspect[prospectID]
		for i, entry := range entries {
			if entry.ToStageID == nil || entry.CreatedAt.IsZero() {
				continue
			}
			end := now
			if i+1 < len(entries) {
				end = entries[i+1].CreatedAt
			}
			if end.Before(entry.CreatedAt) {
				continue
			}
			totals[*entry.ToStageID] += end.Sub(entry.CreatedAt).Hours() / 24
			counts[*entry.ToStageID]++
		}
	}
	for stageID, total := range totals {
		if idx, ok := index[stageID]; ok && counts[stageID] > 0 {
			stages[idx].AverageVelocityDays = round2(total / float64(counts[stageID]))
		}
	}
}

func weightedAmount(expected, probability float64) (amount.Amount, error) {
	probFactor, err := amount.FromFloat64(probability).Div(amount.FromInt64(100))
	if err != nil {
		return amount.Amount{}, err
	}
	return amount.FromFloat64(expected).Mul(probFactor).Round(4), nil
}

func winRate(won, lost int64) float64 {
	denominator := won + lost
	if denominator == 0 {
		return 0
	}
	rate, err := amount.FromInt64(won).Div(amount.FromInt64(denominator))
	if err != nil {
		return 0
	}
	return rate.Mul(amount.FromInt64(100)).Round(2).Float64()
}

func scopedQuery(organizationID *uint64) *query.Query {
	q := &query.Query{}
	if organizationID != nil {
		q.Filters = []query.Filter{{Field: "organization_id", Operator: query.Equal, Value: *organizationID}}
	}
	return q
}

func averageExpected(prospects []*Prospect) float64 {
	if len(prospects) == 0 {
		return 0
	}
	total := 0.0
	for _, prospect := range prospects {
		total += prospect.ExpectedRevenue
	}
	return round2(total / float64(len(prospects)))
}

func averageSalesCycle(prospects []*Prospect, now time.Time) float64 {
	totalDays := 0.0
	count := int64(0)
	for _, prospect := range prospects {
		if prospect.Type != ProspectKindOpportunity || prospect.Status != ProspectStatusWon {
			continue
		}
		start := prospect.CreatedAt
		if prospect.ConvertedAt != nil {
			start = *prospect.ConvertedAt
		}
		end := now
		if prospect.ClosedAt != nil {
			end = *prospect.ClosedAt
		}
		if !start.IsZero() {
			totalDays += end.Sub(start).Hours() / 24
			count++
		}
	}
	if count == 0 {
		return 0
	}
	return round2(totalDays / float64(count))
}

func percentage(part, total int64) float64 {
	if total == 0 {
		return 0
	}
	return round2(float64(part) / float64(total) * 100)
}

func round2(value float64) float64 {
	return amount.FromFloat64(value).Round(2).Float64()
}

func ownerKey(prospect *Prospect) string {
	if prospect.SalespersonID != nil {
		return "salesperson:" + uintToString(*prospect.SalespersonID)
	}
	if prospect.SalesGroupID != nil {
		return "team:" + uintToString(*prospect.SalesGroupID)
	}
	if prospect.OwnerUserID != nil {
		return "user:" + uintToString(*prospect.OwnerUserID)
	}
	return "unassigned"
}

func ownerKeyValue(owner *OwnerPerformance) string {
	if owner.SalespersonID != nil {
		return "salesperson:" + uintToString(*owner.SalespersonID)
	}
	if owner.SalesGroupID != nil {
		return "team:" + uintToString(*owner.SalesGroupID)
	}
	if owner.OwnerUserID != nil {
		return "user:" + uintToString(*owner.OwnerUserID)
	}
	return "unassigned"
}

func uintToString(value uint64) string {
	return strconv.FormatUint(value, 10)
}
