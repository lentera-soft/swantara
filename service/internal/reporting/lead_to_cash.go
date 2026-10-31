package reporting

import (
	"context"
	"math"
	"time"
)

type LeadToCashFunnel struct {
	Leads                  int64   `json:"leads"`
	QualifiedOpportunities int64   `json:"qualified_opportunities"`
	WonOpportunities       int64   `json:"won_opportunities"`
	LostOpportunities      int64   `json:"lost_opportunities"`
	Quotes                 int64   `json:"quotes"`
	AcceptedQuotes         int64   `json:"accepted_quotes"`
	Orders                 int64   `json:"orders"`
	Invoices               int64   `json:"invoices"`
	PaidInvoices           int64   `json:"paid_invoices"`
	QuotedValue            float64 `json:"quoted_value"`
	OrderedValue           float64 `json:"ordered_value"`
	InvoicedValue          float64 `json:"invoiced_value"`
	CollectedCash          float64 `json:"collected_cash"`
	WinRate                float64 `json:"win_rate"`
	CashConversionRate     float64 `json:"cash_conversion_rate"`
}

type LeadToCashCycleTimes struct {
	LeadToOpportunityDays  float64 `json:"lead_to_opportunity_days"`
	OpportunityToQuoteDays float64 `json:"opportunity_to_quote_days"`
	QuoteToOrderDays       float64 `json:"quote_to_order_days"`
	OrderToCashDays        float64 `json:"order_to_cash_days"`
}

type LeadToCashSegment struct {
	Dimension              string  `json:"dimension"`
	Key                    string  `json:"key"`
	LeadCount              int64   `json:"lead_count"`
	QualifiedOpportunities int64   `json:"qualified_opportunities"`
	WonOpportunities       int64   `json:"won_opportunities"`
	LostOpportunities      int64   `json:"lost_opportunities"`
	WinRate                float64 `json:"win_rate"`
	WonRevenue             float64 `json:"won_revenue"`
	Quotes                 int64   `json:"quotes"`
	QuotedValue            float64 `json:"quoted_value"`
	Orders                 int64   `json:"orders"`
	OrderedValue           float64 `json:"ordered_value"`
	CollectedCash          float64 `json:"collected_cash"`
	CashConversionRate     float64 `json:"cash_conversion_rate"`
}

type LeadToCashReport struct {
	OrganizationID uint64               `json:"organization_id"`
	Start          time.Time            `json:"start"`
	End            time.Time            `json:"end"`
	Funnel         LeadToCashFunnel     `json:"funnel"`
	CycleTimes     LeadToCashCycleTimes `json:"cycle_times"`
	Sources        []LeadToCashSegment  `json:"sources"`
	Owners         []LeadToCashSegment  `json:"owners"`
	SalesGroups    []LeadToCashSegment  `json:"sales_groups"`
}

type LeadToCashDAO interface {
	Funnel(ctx context.Context, organizationID uint64, start, end time.Time) (LeadToCashFunnel, error)
	CycleTimes(ctx context.Context, organizationID uint64, start, end time.Time) (LeadToCashCycleTimes, error)
	Segments(ctx context.Context, organizationID uint64, dimension string, start, end time.Time) ([]LeadToCashSegment, error)
}

type LeadToCashService struct {
	metrics LeadToCashDAO
}

func NewLeadToCashService(metrics LeadToCashDAO) LeadToCashService {
	return LeadToCashService{metrics: metrics}
}

func (s LeadToCashService) Report(ctx context.Context, organizationID uint64, start, end time.Time) (LeadToCashReport, error) {
	funnel, err := s.metrics.Funnel(ctx, organizationID, start, end)
	if err != nil {
		return LeadToCashReport{}, err
	}
	cycles, err := s.metrics.CycleTimes(ctx, organizationID, start, end)
	if err != nil {
		return LeadToCashReport{}, err
	}
	sources, err := s.metrics.Segments(ctx, organizationID, SegmentDimensionSource, start, end)
	if err != nil {
		return LeadToCashReport{}, err
	}
	owners, err := s.metrics.Segments(ctx, organizationID, SegmentDimensionOwner, start, end)
	if err != nil {
		return LeadToCashReport{}, err
	}
	groups, err := s.metrics.Segments(ctx, organizationID, SegmentDimensionSalesGroup, start, end)
	if err != nil {
		return LeadToCashReport{}, err
	}

	funnel.WinRate = ratio(float64(funnel.WonOpportunities), float64(funnel.WonOpportunities+funnel.LostOpportunities))
	funnel.CashConversionRate = ratio(funnel.CollectedCash, funnel.OrderedValue)
	for _, segments := range [][]LeadToCashSegment{sources, owners, groups} {
		for i := range segments {
			segments[i].WinRate = ratio(float64(segments[i].WonOpportunities), float64(segments[i].WonOpportunities+segments[i].LostOpportunities))
			segments[i].CashConversionRate = ratio(segments[i].CollectedCash, segments[i].OrderedValue)
		}
	}

	return LeadToCashReport{
		OrganizationID: organizationID,
		Start:          start,
		End:            end,
		Funnel:         funnel,
		CycleTimes:     cycles,
		Sources:        sources,
		Owners:         owners,
		SalesGroups:    groups,
	}, nil
}

func ratio(part, whole float64) float64 {
	if whole == 0 {
		return 0
	}
	return math.Round(part/whole*10000) / 10000
}
