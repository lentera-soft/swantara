package reporting

import (
	"context"
	"fmt"
	"time"

	"gorm.io/gorm"
)

const (
	SegmentDimensionSource     = "source"
	SegmentDimensionOwner      = "owner"
	SegmentDimensionSalesGroup = "sales_group"
)

var leadToCashSegmentColumns = map[string]string{
	SegmentDimensionSource:     "p.source",
	SegmentDimensionOwner:      "COALESCE(p.owner_user_id, p.salesperson_id)",
	SegmentDimensionSalesGroup: "p.sales_group_id",
}

type leadToCashDAO struct {
	db *gorm.DB
}

func NewLeadToCashDAO(db *gorm.DB) LeadToCashDAO {
	return leadToCashDAO{db: db}
}

const leadToCashFunnelQuery = `
	WITH leads AS (
		SELECT COUNT(*) AS leads
		FROM prospects p
		WHERE p.organization_id = ? AND p.deleted_at IS NULL AND p.type = 'prospect'
		  AND p.created_at >= ? AND p.created_at <= ?
	),
	opportunities AS (
		SELECT
			COUNT(*) FILTER (WHERE p.qualified_at IS NOT NULL OR p.status IN ('qualified', 'converted', 'won')) AS qualified_opportunities,
			COUNT(*) FILTER (WHERE p.status = 'won') AS won_opportunities,
			COUNT(*) FILTER (WHERE p.status = 'lost' OR p.lost_reason IS NOT NULL) AS lost_opportunities
		FROM prospects p
		WHERE p.organization_id = ? AND p.deleted_at IS NULL AND p.type = 'opportunity'
		  AND p.created_at >= ? AND p.created_at <= ?
	),
	quotes AS (
		SELECT
			COUNT(*) AS quotes,
			COUNT(*) FILTER (WHERE q.state = 'accepted') AS accepted_quotes,
			COALESCE(SUM(q.amount_total), 0) AS quoted_value
		FROM sale_quotes q
		WHERE q.organization_id = ? AND q.deleted_at IS NULL
		  AND q.created_at >= ? AND q.created_at <= ?
	),
	orders AS (
		SELECT
			COUNT(*) AS orders,
			COALESCE(SUM(o.amount_total), 0) AS ordered_value
		FROM sale_orders o
		WHERE o.organization_id = ? AND o.deleted_at IS NULL AND o.state <> 'cancelled'
		  AND o.created_at >= ? AND o.created_at <= ?
	),
	invoice_totals AS (
		SELECT
			COUNT(*) AS invoices,
			COUNT(*) FILTER (WHERE i.payment_state = 'paid') AS paid_invoices,
			COALESCE(SUM(i.amount_total), 0) AS invoiced_value
		FROM invoices i
		WHERE i.organization_id = ? AND i.deleted_at IS NULL AND i.type = 'customer_invoice'
		  AND i.state = 'posted' AND i.invoice_date >= ? AND i.invoice_date <= ?
	),
	cash AS (
		SELECT COALESCE(SUM(pa.amount), 0) AS collected_cash
		FROM payment_allocations pa
		JOIN payments pay ON pay.id = pa.payment_id
		JOIN invoices i ON i.id = pa.invoice_id AND i.type = 'customer_invoice'
		WHERE pay.organization_id = ? AND pay.deleted_at IS NULL AND pay.type = 'inbound' AND pa.deleted_at IS NULL
		  AND pay.state IN ('posted', 'reconciled') AND pay.date >= ? AND pay.date <= ?
	)
	SELECT l.leads, o.qualified_opportunities, o.won_opportunities, o.lost_opportunities,
	       q.quotes, q.accepted_quotes, q.quoted_value,
	       ord.orders, ord.ordered_value,
	       i.invoices, i.paid_invoices, i.invoiced_value,
	       c.collected_cash
	FROM leads l, opportunities o, quotes q, orders ord, invoice_totals i, cash c`

func (d leadToCashDAO) Funnel(ctx context.Context, organizationID uint64, start, end time.Time) (LeadToCashFunnel, error) {
	var funnel LeadToCashFunnel
	err := d.db.WithContext(ctx).Raw(leadToCashFunnelQuery,
		organizationID, start, end,
		organizationID, start, end,
		organizationID, start, end,
		organizationID, start, end,
		organizationID, start, end,
		organizationID, start, end,
	).Scan(&funnel).Error
	return funnel, err
}

const leadToCashCycleTimesQuery = `
	WITH lead_cycle AS (
		SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (p.qualified_at - p.created_at)) / 86400.0), 0) AS lead_to_opportunity_days
		FROM prospects p
		WHERE p.organization_id = ? AND p.deleted_at IS NULL AND p.type = 'opportunity'
		  AND p.qualified_at IS NOT NULL AND p.created_at >= ? AND p.created_at <= ?
	),
	quote_cycle AS (
		SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (q.created_at - p.qualified_at)) / 86400.0), 0) AS opportunity_to_quote_days
		FROM sale_quotes q
		JOIN prospects p ON p.id = q.prospect_id AND p.organization_id = q.organization_id
		WHERE q.organization_id = ? AND q.deleted_at IS NULL AND p.qualified_at IS NOT NULL
		  AND q.created_at >= ? AND q.created_at <= ?
	),
	order_cycle AS (
		SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (o.created_at - q.accepted_at)) / 86400.0), 0) AS quote_to_order_days
		FROM sale_orders o
		JOIN sale_quotes q ON q.id = o.quote_id AND q.organization_id = o.organization_id
		WHERE o.organization_id = ? AND o.deleted_at IS NULL AND q.accepted_at IS NOT NULL
		  AND o.created_at >= ? AND o.created_at <= ?
	),
	cash_cycle AS (
		SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (pay.date - o.created_at)) / 86400.0), 0) AS order_to_cash_days
		FROM sale_orders o
		JOIN (
			SELECT DISTINCT sol.order_id, i.id AS invoice_id
			FROM invoice_lines il
			JOIN sale_order_lines sol ON sol.id = il.sale_line_id
			JOIN invoices i ON i.id = il.invoice_id
			WHERE i.organization_id = ? AND i.type = 'customer_invoice' AND i.state = 'posted' AND i.deleted_at IS NULL
		) inv ON inv.order_id = o.id
		JOIN payment_allocations pa ON pa.invoice_id = inv.invoice_id AND pa.deleted_at IS NULL
		JOIN payments pay ON pay.id = pa.payment_id AND pay.organization_id = ? AND pay.deleted_at IS NULL
		  AND pay.type = 'inbound' AND pay.state IN ('posted', 'reconciled')
		WHERE o.organization_id = ? AND o.deleted_at IS NULL AND o.created_at >= ? AND o.created_at <= ?
	)
	SELECT l.lead_to_opportunity_days, q.opportunity_to_quote_days, o.quote_to_order_days, c.order_to_cash_days
	FROM lead_cycle l, quote_cycle q, order_cycle o, cash_cycle c`

func (d leadToCashDAO) CycleTimes(ctx context.Context, organizationID uint64, start, end time.Time) (LeadToCashCycleTimes, error) {
	var cycles LeadToCashCycleTimes
	err := d.db.WithContext(ctx).Raw(leadToCashCycleTimesQuery,
		organizationID, start, end,
		organizationID, start, end,
		organizationID, start, end,
		organizationID, organizationID, organizationID, start, end,
	).Scan(&cycles).Error
	return cycles, err
}

const leadToCashSegmentsQuery = `
	WITH base AS (
		SELECT p.id, p.type, p.status, p.lost_reason, p.qualified_at, p.expected_revenue, p.created_at,
		       %s AS raw_segment
		FROM prospects p
		WHERE p.organization_id = ? AND p.deleted_at IS NULL
	),
	segments AS (
		SELECT COALESCE(NULLIF(CAST(raw_segment AS TEXT), ''), 'unassigned') AS segment,
		       COUNT(*) FILTER (WHERE type = 'prospect' AND created_at >= ? AND created_at <= ?) AS lead_count,
		       COUNT(*) FILTER (WHERE type = 'opportunity' AND (qualified_at IS NOT NULL OR status IN ('qualified', 'converted', 'won')) AND created_at >= ? AND created_at <= ?) AS qualified_opportunities,
		       COUNT(*) FILTER (WHERE type = 'opportunity' AND status = 'won' AND created_at >= ? AND created_at <= ?) AS won_opportunities,
		       COUNT(*) FILTER (WHERE type = 'opportunity' AND (status = 'lost' OR lost_reason IS NOT NULL) AND created_at >= ? AND created_at <= ?) AS lost_opportunities,
		       COALESCE(SUM(expected_revenue) FILTER (WHERE type = 'opportunity' AND status = 'won' AND created_at >= ? AND created_at <= ?), 0) AS won_revenue
		FROM base
		GROUP BY 1
	),
	quotes AS (
		SELECT COALESCE(NULLIF(CAST(b.raw_segment AS TEXT), ''), 'unassigned') AS segment,
		       COUNT(*) AS quote_count, COALESCE(SUM(q.amount_total), 0) AS quoted_value
		FROM base b
		JOIN sale_quotes q ON q.prospect_id = b.id AND q.organization_id = ? AND q.deleted_at IS NULL
		  AND q.created_at >= ? AND q.created_at <= ?
		GROUP BY 1
	),
	orders AS (
		SELECT COALESCE(NULLIF(CAST(b.raw_segment AS TEXT), ''), 'unassigned') AS segment,
		       COUNT(*) AS order_count, COALESCE(SUM(o.amount_total), 0) AS ordered_value
		FROM base b
		JOIN sale_orders o ON o.prospect_id = b.id AND o.organization_id = ? AND o.deleted_at IS NULL AND o.state <> 'cancelled'
		  AND o.created_at >= ? AND o.created_at <= ?
		GROUP BY 1
	),
	cash AS (
		SELECT COALESCE(NULLIF(CAST(b.raw_segment AS TEXT), ''), 'unassigned') AS segment,
		       COALESCE(SUM(pa.amount), 0) AS collected_cash
		FROM base b
		JOIN sale_orders o ON o.prospect_id = b.id AND o.organization_id = ? AND o.deleted_at IS NULL
		JOIN (
			SELECT DISTINCT sol.order_id, i.id AS invoice_id
			FROM invoice_lines il
			JOIN sale_order_lines sol ON sol.id = il.sale_line_id
			JOIN invoices i ON i.id = il.invoice_id
			WHERE i.organization_id = ? AND i.type = 'customer_invoice' AND i.state = 'posted' AND i.deleted_at IS NULL
		) inv ON inv.order_id = o.id
		JOIN payment_allocations pa ON pa.invoice_id = inv.invoice_id AND pa.deleted_at IS NULL
		JOIN payments pay ON pay.id = pa.payment_id AND pay.organization_id = ? AND pay.deleted_at IS NULL
		  AND pay.type = 'inbound' AND pay.state IN ('posted', 'reconciled') AND pay.date >= ? AND pay.date <= ?
		GROUP BY 1
	)
	SELECT s.segment, s.lead_count, s.qualified_opportunities, s.won_opportunities, s.lost_opportunities,
	       s.won_revenue, COALESCE(q.quote_count, 0) AS quote_count, COALESCE(q.quoted_value, 0) AS quoted_value,
	       COALESCE(o.order_count, 0) AS order_count, COALESCE(o.ordered_value, 0) AS ordered_value,
	       COALESCE(c.collected_cash, 0) AS collected_cash
	FROM segments s
	LEFT JOIN quotes q ON q.segment = s.segment
	LEFT JOIN orders o ON o.segment = s.segment
	LEFT JOIN cash c ON c.segment = s.segment
	ORDER BY s.segment`

type leadToCashSegmentRow struct {
	Segment                string
	LeadCount              int64
	QualifiedOpportunities int64
	WonOpportunities       int64
	LostOpportunities      int64
	WonRevenue             float64
	QuoteCount             int64
	QuotedValue            float64
	OrderCount             int64
	OrderedValue           float64
	CollectedCash          float64
}

func (d leadToCashDAO) Segments(ctx context.Context, organizationID uint64, dimension string, start, end time.Time) ([]LeadToCashSegment, error) {
	column, ok := leadToCashSegmentColumns[dimension]
	if !ok {
		return nil, ErrLeadToCashDimension
	}
	rows := make([]leadToCashSegmentRow, 0)
	err := d.db.WithContext(ctx).Raw(fmt.Sprintf(leadToCashSegmentsQuery, column),
		organizationID,
		start, end,
		start, end,
		start, end,
		start, end,
		start, end,
		organizationID, start, end,
		organizationID, start, end,
		organizationID, organizationID, organizationID, start, end,
	).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	segments := make([]LeadToCashSegment, 0, len(rows))
	for _, row := range rows {
		segments = append(segments, LeadToCashSegment{
			Dimension:              dimension,
			Key:                    row.Segment,
			LeadCount:              row.LeadCount,
			QualifiedOpportunities: row.QualifiedOpportunities,
			WonOpportunities:       row.WonOpportunities,
			LostOpportunities:      row.LostOpportunities,
			WonRevenue:             row.WonRevenue,
			Quotes:                 row.QuoteCount,
			QuotedValue:            row.QuotedValue,
			Orders:                 row.OrderCount,
			OrderedValue:           row.OrderedValue,
			CollectedCash:          row.CollectedCash,
		})
	}
	return segments, nil
}
