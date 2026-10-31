package reporting

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
)

func TestLeadToCashDAOFunnel(t *testing.T) {
	db, mock := query.NewMockDB(t)
	start := time.Date(2026, 10, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(2026, 10, 31, 0, 0, 0, 0, time.UTC)
	args := []any{
		1, start, end,
		1, start, end,
		1, start, end,
		1, start, end,
		1, start, end,
		1, start, end,
	}
	expectRawQuery(mock, leadToCashFunnelQuery, args...).
		WillReturnRows(sqlmock.NewRows([]string{
			"leads", "qualified_opportunities", "won_opportunities", "lost_opportunities",
			"quotes", "accepted_quotes", "quoted_value", "orders", "ordered_value",
			"invoices", "paid_invoices", "invoiced_value", "collected_cash",
		}).AddRow(20, 10, 6, 2, 8, 5, 8000, 4, 4000, 3, 2, 3000, 1500))

	funnel, err := NewLeadToCashDAO(db).Funnel(context.Background(), 1, start, end)
	if err != nil {
		t.Fatalf("Funnel() error = %v", err)
	}
	if funnel.Leads != 20 || funnel.WonOpportunities != 6 || funnel.CollectedCash != 1500 {
		t.Fatalf("funnel = %+v", funnel)
	}
	if funnel.QuotedValue != 8000 || funnel.OrderedValue != 4000 || funnel.InvoicedValue != 3000 {
		t.Fatalf("funnel values = %+v", funnel)
	}
}

func TestLeadToCashDAOCycleTimes(t *testing.T) {
	db, mock := query.NewMockDB(t)
	start := time.Date(2026, 10, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(2026, 10, 31, 0, 0, 0, 0, time.UTC)
	args := []any{
		1, start, end,
		1, start, end,
		1, start, end,
		1, 1, 1, start, end,
	}
	expectRawQuery(mock, leadToCashCycleTimesQuery, args...).
		WillReturnRows(sqlmock.NewRows([]string{
			"lead_to_opportunity_days", "opportunity_to_quote_days", "quote_to_order_days", "order_to_cash_days",
		}).AddRow(2.5, 1.5, 3, 4))

	cycles, err := NewLeadToCashDAO(db).CycleTimes(context.Background(), 1, start, end)
	if err != nil {
		t.Fatalf("CycleTimes() error = %v", err)
	}
	if cycles.LeadToOpportunityDays != 2.5 || cycles.OpportunityToQuoteDays != 1.5 ||
		cycles.QuoteToOrderDays != 3 || cycles.OrderToCashDays != 4 {
		t.Fatalf("cycles = %+v", cycles)
	}
}

func TestLeadToCashDAOSegments(t *testing.T) {
	db, mock := query.NewMockDB(t)
	start := time.Date(2026, 10, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(2026, 10, 31, 0, 0, 0, 0, time.UTC)
	args := []any{
		1,
		start, end,
		start, end,
		start, end,
		start, end,
		start, end,
		1, start, end,
		1, start, end,
		1, 1, 1, start, end,
	}
	expectRawQuery(mock, fmt.Sprintf(leadToCashSegmentsQuery, "p.source"), args...).
		WillReturnRows(sqlmock.NewRows([]string{
			"segment", "lead_count", "qualified_opportunities", "won_opportunities", "lost_opportunities",
			"won_revenue", "quote_count", "quoted_value", "order_count", "ordered_value", "collected_cash",
		}).AddRow("inbound", 10, 5, 3, 1, 600, 4, 800, 2, 400, 150))

	segments, err := NewLeadToCashDAO(db).Segments(context.Background(), 1, SegmentDimensionSource, start, end)
	if err != nil {
		t.Fatalf("Segments() error = %v", err)
	}
	if len(segments) != 1 {
		t.Fatalf("segments = %+v, want one", segments)
	}
	got := segments[0]
	if got.Dimension != SegmentDimensionSource || got.Key != "inbound" || got.LeadCount != 10 {
		t.Fatalf("segment = %+v", got)
	}
	if got.Quotes != 4 || got.Orders != 2 || got.CollectedCash != 150 {
		t.Fatalf("segment values = %+v", got)
	}
}
