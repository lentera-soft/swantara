package reporting

import (
	"context"
	"testing"
	"time"
)

type leadToCashDAOMock struct {
	funnel   LeadToCashFunnel
	cycles   LeadToCashCycleTimes
	segments map[string][]LeadToCashSegment
	errors   map[string]error
}

func (m leadToCashDAOMock) Funnel(context.Context, uint64, time.Time, time.Time) (LeadToCashFunnel, error) {
	return m.funnel, nil
}

func (m leadToCashDAOMock) CycleTimes(context.Context, uint64, time.Time, time.Time) (LeadToCashCycleTimes, error) {
	return m.cycles, nil
}

func (m leadToCashDAOMock) Segments(_ context.Context, _ uint64, dimension string, _, _ time.Time) ([]LeadToCashSegment, error) {
	if err := m.errors[dimension]; err != nil {
		return nil, err
	}
	return m.segments[dimension], nil
}

func TestLeadToCashServiceReportComputesRates(t *testing.T) {
	start := time.Date(2026, 10, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(2026, 10, 31, 0, 0, 0, 0, time.UTC)
	metrics := leadToCashDAOMock{
		funnel: LeadToCashFunnel{
			Leads:                  10,
			QualifiedOpportunities: 5,
			WonOpportunities:       3,
			LostOpportunities:      1,
			OrderedValue:           1000,
			CollectedCash:          250,
		},
		cycles: LeadToCashCycleTimes{LeadToOpportunityDays: 2, OpportunityToQuoteDays: 3, QuoteToOrderDays: 4, OrderToCashDays: 5},
		segments: map[string][]LeadToCashSegment{
			SegmentDimensionSource: {
				{Dimension: SegmentDimensionSource, Key: "inbound", WonOpportunities: 2, LostOpportunities: 2, OrderedValue: 400, CollectedCash: 100},
			},
			SegmentDimensionOwner: {
				{Dimension: SegmentDimensionOwner, Key: "7", WonOpportunities: 1, LostOpportunities: 0, OrderedValue: 0, CollectedCash: 0},
			},
			SegmentDimensionSalesGroup: {
				{Dimension: SegmentDimensionSalesGroup, Key: "unassigned", WonOpportunities: 1, LostOpportunities: 1, OrderedValue: 200, CollectedCash: 50},
			},
		},
		errors: map[string]error{},
	}

	report, err := NewLeadToCashService(metrics).Report(context.Background(), 9, start, end)
	if err != nil {
		t.Fatalf("Report() error = %v", err)
	}
	if report.OrganizationID != 9 {
		t.Fatalf("organization_id = %d, want 9", report.OrganizationID)
	}
	if report.Funnel.WinRate != 0.75 {
		t.Errorf("win rate = %v, want 0.75", report.Funnel.WinRate)
	}
	if report.Funnel.CashConversionRate != 0.25 {
		t.Errorf("cash conversion = %v, want 0.25", report.Funnel.CashConversionRate)
	}
	if len(report.Sources) != 1 || report.Sources[0].WinRate != 0.5 || report.Sources[0].CashConversionRate != 0.25 {
		t.Errorf("sources = %+v, want computed rates", report.Sources)
	}
	if report.Owners[0].WinRate != 1 || report.Owners[0].CashConversionRate != 0 {
		t.Errorf("owners = %+v, want computed rates", report.Owners)
	}
	if report.SalesGroups[0].WinRate != 0.5 || report.SalesGroups[0].CashConversionRate != 0.25 {
		t.Errorf("sales groups = %+v, want computed rates", report.SalesGroups)
	}
	if report.CycleTimes != metrics.cycles {
		t.Errorf("cycle times = %+v, want %+v", report.CycleTimes, metrics.cycles)
	}
}

func TestLeadToCashServiceReportReturnsSegmentErrors(t *testing.T) {
	metrics := leadToCashDAOMock{
		segments: map[string][]LeadToCashSegment{},
		errors:   map[string]error{SegmentDimensionOwner: ErrLeadToCashDimension},
	}
	_, err := NewLeadToCashService(metrics).Report(context.Background(), 9, time.Time{}, time.Time{})
	if err != ErrLeadToCashDimension {
		t.Fatalf("Report() error = %v, want %v", err, ErrLeadToCashDimension)
	}
}

func TestLeadToCashDAORejectsUnknownDimension(t *testing.T) {
	_, err := leadToCashDAO{}.Segments(context.Background(), 1, "unknown", time.Time{}, time.Time{})
	if err != ErrLeadToCashDimension {
		t.Fatalf("Segments() error = %v, want %v", err, ErrLeadToCashDimension)
	}
}
