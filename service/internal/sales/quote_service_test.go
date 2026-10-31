package sales

import (
	"context"
	"testing"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/contacts"
	"github.com/jalusw/swantara/apps/service/internal/crm"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/kernel/sequence"
	"github.com/jalusw/swantara/apps/service/internal/products"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

func testSaleQuoteService(quotes SaleQuoteDAOMock, lines SaleQuoteLineDAOMock) SaleQuoteService {
	sequences := sequence.NewService(SequenceDAOMock{
		ReserveFunc: func(_ context.Context, _ uint64, _ string, _ time.Time) (*sequence.Reservation, error) {
			return &sequence.Reservation{Value: 1, Number: "SQ/00001"}, nil
		},
	})
	return NewSaleQuoteService(
		SaleQuoteRepositories{
			Quotes: quotes,
			Lines:  lines,
			PriceBooks: products.PriceBookDAOMock{
				CRUDMock: dao.CRUDMock[products.PriceBook]{
					FindFunc: func(_ context.Context, _ uint64) (*products.PriceBook, error) {
						return &products.PriceBook{Base: model.Base{ID: 2}, Name: "Retail", CurrencyCode: helper.Ptr("IDR")}, nil
					},
				},
			},
			Taxes: dao.CRUDMock[reference.Tax]{},
			Contacts: contacts.ContactDAOMock{
				CRUDMock: dao.CRUDMock[contacts.Contact]{
					FindFunc: func(_ context.Context, _ uint64) (*contacts.Contact, error) {
						return &contacts.Contact{Base: model.Base{ID: 5}}, nil
					},
				},
			},
			Leads: crm.ProspectDAOMock{
				CRUDMock: dao.CRUDMock[crm.Prospect]{
					FindFunc: func(_ context.Context, _ uint64) (*crm.Prospect, error) {
						return &crm.Prospect{Base: model.Base{ID: 3}, OrganizationID: helper.Ptr(uint64(1)), Type: crm.ProspectKindOpportunity, Status: crm.ProspectStatusQualified, ContactID: helper.Ptr(uint64(5)), CurrencyCode: "IDR"}, nil
					},
				},
			},
		},
		SaleQuoteEngines{Sequences: sequences, Product: testPriceService(100)},
	).WithClock(func() time.Time {
		return time.Date(2026, time.October, 26, 10, 0, 0, 0, time.UTC)
	})
}

func TestSaleQuoteService_Create(t *testing.T) {
	quotes := SaleQuoteDAOMock{
		CreateWithLinesFunc: func(_ context.Context, quote *SaleQuote, lines []*SaleQuoteLine) (*SaleQuote, error) {
			quote.ID = 7
			for i, line := range lines {
				line.ID = uint64(i + 1)
				line.QuoteID = quote.ID
			}
			return quote, nil
		},
	}
	svc := testSaleQuoteService(quotes, SaleQuoteLineDAOMock{})
	quote, err := svc.Create(context.Background(), &SaleQuote{
		OrganizationID: helper.Ptr(uint64(1)),
		ContactID:      5,
		PriceBookID:    helper.Ptr(uint64(2)),
		ProspectID:     helper.Ptr(uint64(3)),
	}, []*SaleQuoteLine{{ItemID: helper.Ptr(uint64(100)), Qty: 2, DiscountPct: 10}})
	if err != nil {
		t.Fatalf("Create() error = %v", err)
	}
	if quote.State != QuoteStateDraft {
		t.Fatalf("state = %q, want draft", quote.State)
	}
	if quote.Version != 1 || !quote.IsCurrent {
		t.Fatalf("version/current = %d/%v, want 1/true", quote.Version, quote.IsCurrent)
	}
	if quote.AmountUntaxed != 180 || quote.AmountTotal != 180 {
		t.Fatalf("amounts = %v/%v, want 180/180", quote.AmountUntaxed, quote.AmountTotal)
	}
	if quote.Name == nil || *quote.Name != "SQ/00001" {
		t.Fatalf("name = %v, want SQ/00001", quote.Name)
	}
	if quote.CurrencyCode == nil || *quote.CurrencyCode != "IDR" {
		t.Fatalf("currency = %v, want IDR", quote.CurrencyCode)
	}
}

func TestSaleQuoteService_CreateValidation(t *testing.T) {
	svc := testSaleQuoteService(SaleQuoteDAOMock{}, SaleQuoteLineDAOMock{})
	base := func() *SaleQuote {
		return &SaleQuote{OrganizationID: helper.Ptr(uint64(1)), ContactID: 5, PriceBookID: helper.Ptr(uint64(2))}
	}
	line := []*SaleQuoteLine{{ItemID: helper.Ptr(uint64(100)), Qty: 1}}

	tests := []struct {
		name  string
		quote *SaleQuote
		lines []*SaleQuoteLine
		want  error
	}{
		{name: "missing lines", quote: base(), want: ErrQuoteNoLines},
		{name: "missing price book", quote: &SaleQuote{OrganizationID: helper.Ptr(uint64(1)), ContactID: 5}, lines: line, want: ErrQuotePriceBook},
		{name: "missing item", quote: base(), lines: []*SaleQuoteLine{{Qty: 1}}, want: ErrQuoteVariant},
		{name: "non positive quantity", quote: base(), lines: []*SaleQuoteLine{{ItemID: helper.Ptr(uint64(100)), Qty: 0}}, want: ErrQuoteQty},
		{name: "invalid discount", quote: base(), lines: []*SaleQuoteLine{{ItemID: helper.Ptr(uint64(100)), Qty: 1, DiscountPct: 101}}, want: ErrQuoteDiscount},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if _, err := svc.Create(context.Background(), tc.quote, tc.lines); err != tc.want {
				t.Fatalf("error = %v, want %v", err, tc.want)
			}
		})
	}
}

func TestSaleQuoteService_SendAcceptAndExpiry(t *testing.T) {
	now := time.Date(2026, time.October, 26, 10, 0, 0, 0, time.UTC)
	quotes := SaleQuoteDAOMock{
		CRUDMock: dao.CRUDMock[SaleQuote]{
			FindFunc: func(_ context.Context, _ uint64) (*SaleQuote, error) {
				return &SaleQuote{Base: model.Base{ID: 7}, OrganizationID: helper.Ptr(uint64(1)), State: QuoteStateSent, IsCurrent: true}, nil
			},
			UpdateFunc: func(_ context.Context, quote *SaleQuote) (*SaleQuote, error) {
				return quote, nil
			},
		},
	}
	svc := testSaleQuoteService(quotes, SaleQuoteLineDAOMock{}).WithClock(func() time.Time { return now })

	accepted, err := svc.Accept(context.Background(), 7)
	if err != nil {
		t.Fatalf("Accept() error = %v", err)
	}
	if accepted.State != QuoteStateAccepted || accepted.AcceptedAt == nil {
		t.Fatalf("accepted state/at = %q/%v, want accepted/set", accepted.State, accepted.AcceptedAt)
	}

	expired := time.Date(2026, time.October, 20, 0, 0, 0, 0, time.UTC)
	quotes.CRUDMock.FindFunc = func(_ context.Context, _ uint64) (*SaleQuote, error) {
		return &SaleQuote{Base: model.Base{ID: 7}, OrganizationID: helper.Ptr(uint64(1)), State: QuoteStateSent, IsCurrent: true, ValidityDate: &expired}, nil
	}
	svc = testSaleQuoteService(quotes, SaleQuoteLineDAOMock{}).WithClock(func() time.Time { return now })
	if _, err := svc.Accept(context.Background(), 7); err != ErrQuoteExpired {
		t.Fatalf("error = %v, want ErrQuoteExpired", err)
	}
}

func TestSaleQuoteService_ReviseKeepsHistory(t *testing.T) {
	var updated *SaleQuote
	quotes := SaleQuoteDAOMock{
		CRUDMock: dao.CRUDMock[SaleQuote]{
			FindFunc: func(_ context.Context, _ uint64) (*SaleQuote, error) {
				return &SaleQuote{
					Base:           model.Base{ID: 7},
					OrganizationID: helper.Ptr(uint64(1)),
					ContactID:      5,
					PriceBookID:    helper.Ptr(uint64(2)),
					State:          QuoteStateSent,
					Version:        1,
					IsCurrent:      true,
				}, nil
			},
			UpdateFunc: func(_ context.Context, quote *SaleQuote) (*SaleQuote, error) {
				updated = quote
				return quote, nil
			},
		},
		CreateWithLinesFunc: func(_ context.Context, quote *SaleQuote, _ []*SaleQuoteLine) (*SaleQuote, error) {
			quote.ID = 8
			return quote, nil
		},
	}
	lines := SaleQuoteLineDAOMock{
		ListByQuoteFunc: func(_ context.Context, _ uint64) ([]*SaleQuoteLine, error) {
			return []*SaleQuoteLine{{Base: model.Base{ID: 1}, QuoteID: 7, ItemID: helper.Ptr(uint64(100)), Qty: 1, UnitPrice: 100}}, nil
		},
	}
	svc := testSaleQuoteService(quotes, lines)

	revised, err := svc.Revise(context.Background(), 7, &SaleQuote{}, nil)
	if err != nil {
		t.Fatalf("Revise() error = %v", err)
	}
	if revised.Version != 2 || !revised.IsCurrent || revised.RootQuoteID == nil || *revised.RootQuoteID != 7 {
		t.Fatalf("revised version/root = %d/%v, want 2/7", revised.Version, revised.RootQuoteID)
	}
	if updated == nil || updated.IsCurrent {
		t.Fatal("previous revision was not marked as not current")
	}
}

func TestSaleQuoteService_DeleteRejectsConverted(t *testing.T) {
	quotes := SaleQuoteDAOMock{
		CRUDMock: dao.CRUDMock[SaleQuote]{
			FindFunc: func(_ context.Context, _ uint64) (*SaleQuote, error) {
				return &SaleQuote{Base: model.Base{ID: 7}, OrganizationID: helper.Ptr(uint64(1)), SaleOrderID: helper.Ptr(uint64(9))}, nil
			},
		},
	}
	svc := testSaleQuoteService(quotes, SaleQuoteLineDAOMock{})
	if err := svc.Delete(context.Background(), 7); err != ErrQuoteState {
		t.Fatalf("error = %v, want ErrQuoteState", err)
	}
}

func TestSaleOrderService_ApplyQuoteCopiesLines(t *testing.T) {
	valid := time.Now().Add(24 * time.Hour)
	quotes := SaleQuoteDAOMock{
		CRUDMock: dao.CRUDMock[SaleQuote]{
			FindFunc: func(_ context.Context, _ uint64) (*SaleQuote, error) {
				return &SaleQuote{
					Base:           model.Base{ID: 7},
					OrganizationID: helper.Ptr(uint64(1)),
					ContactID:      5,
					PriceBookID:    helper.Ptr(uint64(2)),
					ProspectID:     helper.Ptr(uint64(3)),
					CurrencyCode:   helper.Ptr("IDR"),
					SalespersonID:  helper.Ptr(uint64(11)),
					SalesGroupID:   helper.Ptr(uint64(12)),
					State:          QuoteStateAccepted,
					ValidityDate:   &valid,
				}, nil
			},
		},
	}
	quoteLines := SaleQuoteLineDAOMock{
		ListByQuoteFunc: func(_ context.Context, _ uint64) ([]*SaleQuoteLine, error) {
			return []*SaleQuoteLine{{ItemID: helper.Ptr(uint64(100)), Qty: 2, UnitPrice: 42, DiscountPct: 5}}, nil
		},
	}
	svc := SaleOrderService{quotes: quotes, quoteLines: quoteLines, now: time.Now}
	order := &SaleOrder{OrganizationID: helper.Ptr(uint64(1)), QuoteID: helper.Ptr(uint64(7))}
	lines := []*SaleOrderLine{}

	if err := svc.applyQuote(context.Background(), order, &lines); err != nil {
		t.Fatalf("applyQuote() error = %v", err)
	}
	if order.ContactID != 5 || order.PriceBookID == nil || *order.PriceBookID != 2 {
		t.Fatalf("order header not copied: %+v", order)
	}
	if order.SalespersonID == nil || *order.SalespersonID != 11 {
		t.Fatalf("salesperson not copied: %+v", order)
	}
	if order.SalesGroupID == nil || *order.SalesGroupID != 12 {
		t.Fatalf("sales group not copied: %+v", order)
	}
	if len(lines) != 1 || lines[0].UnitPrice != 42 || lines[0].QtyOrdered != 2 {
		t.Fatalf("lines not copied: %+v", lines)
	}

	quotes.CRUDMock.FindFunc = func(_ context.Context, _ uint64) (*SaleQuote, error) {
		return &SaleQuote{Base: model.Base{ID: 7}, OrganizationID: helper.Ptr(uint64(1)), State: QuoteStateAccepted, SaleOrderID: helper.Ptr(uint64(9))}, nil
	}
	svc = SaleOrderService{quotes: quotes, quoteLines: quoteLines, now: time.Now}
	if err := svc.applyQuote(context.Background(), order, &lines); err != ErrQuoteAlreadyConverted {
		t.Fatalf("error = %v, want ErrQuoteAlreadyConverted", err)
	}
}

func TestSaleQuoteService_CreateCarriesOpportunityDefaults(t *testing.T) {
	expectedClose := time.Date(2026, time.November, 30, 0, 0, 0, 0, time.UTC)
	quotes := SaleQuoteDAOMock{
		CreateWithLinesFunc: func(_ context.Context, quote *SaleQuote, _ []*SaleQuoteLine) (*SaleQuote, error) {
			quote.ID = 9
			return quote, nil
		},
	}
	svc := testSaleQuoteService(quotes, SaleQuoteLineDAOMock{})
	svc.leads = crm.ProspectDAOMock{
		CRUDMock: dao.CRUDMock[crm.Prospect]{
			FindFunc: func(_ context.Context, _ uint64) (*crm.Prospect, error) {
				return &crm.Prospect{
					Base:            model.Base{ID: 3},
					OrganizationID:  helper.Ptr(uint64(1)),
					Type:            crm.ProspectKindOpportunity,
					Status:          crm.ProspectStatusQualified,
					ContactID:       helper.Ptr(uint64(5)),
					CurrencyCode:    "USD",
					SalespersonID:   helper.Ptr(uint64(11)),
					SalesGroupID:    helper.Ptr(uint64(12)),
					ExpectedClose:   &expectedClose,
					ExpectedRevenue: 5000,
				}, nil
			},
		},
	}

	quote, err := svc.Create(context.Background(), &SaleQuote{
		OrganizationID: helper.Ptr(uint64(1)),
		PriceBookID:    helper.Ptr(uint64(2)),
		ProspectID:     helper.Ptr(uint64(3)),
	}, []*SaleQuoteLine{{ItemID: helper.Ptr(uint64(100)), Qty: 1}})
	if err != nil {
		t.Fatalf("Create() error = %v", err)
	}
	if quote.ContactID != 5 {
		t.Fatalf("contact_id = %d, want 5", quote.ContactID)
	}
	if quote.CurrencyCode == nil || *quote.CurrencyCode != "USD" {
		t.Fatalf("currency = %v, want USD", quote.CurrencyCode)
	}
	if quote.SalespersonID == nil || *quote.SalespersonID != 11 {
		t.Fatalf("salesperson = %v, want 11", quote.SalespersonID)
	}
	if quote.SalesGroupID == nil || *quote.SalesGroupID != 12 {
		t.Fatalf("sales_group = %v, want 12", quote.SalesGroupID)
	}
	if quote.ValidityDate == nil || !quote.ValidityDate.Equal(expectedClose) {
		t.Fatalf("validity_date = %v, want %v", quote.ValidityDate, expectedClose)
	}
	if quote.ExpectedRevenue == nil || *quote.ExpectedRevenue != 5000 {
		t.Fatalf("expected_revenue = %v, want 5000", quote.ExpectedRevenue)
	}
}

func TestSaleQuoteService_RejectsLostOpportunity(t *testing.T) {
	svc := testSaleQuoteService(SaleQuoteDAOMock{}, SaleQuoteLineDAOMock{})
	svc.leads = crm.ProspectDAOMock{
		CRUDMock: dao.CRUDMock[crm.Prospect]{
			FindFunc: func(_ context.Context, _ uint64) (*crm.Prospect, error) {
				return &crm.Prospect{
					Base:           model.Base{ID: 3},
					OrganizationID: helper.Ptr(uint64(1)),
					Type:           crm.ProspectKindOpportunity,
					Status:         crm.ProspectStatusLost,
					ContactID:      helper.Ptr(uint64(5)),
					LostReason:     helper.Ptr("budget"),
				}, nil
			},
		},
	}
	_, err := svc.Create(context.Background(), &SaleQuote{
		OrganizationID: helper.Ptr(uint64(1)),
		PriceBookID:    helper.Ptr(uint64(2)),
		ProspectID:     helper.Ptr(uint64(3)),
	}, []*SaleQuoteLine{{ItemID: helper.Ptr(uint64(100)), Qty: 1}})
	if err != ErrQuoteLeadClosed {
		t.Fatalf("error = %v, want ErrQuoteLeadClosed", err)
	}
}

func TestSaleOrderService_ApplyQuoteRejectsExpired(t *testing.T) {
	expired := time.Date(2026, time.October, 20, 0, 0, 0, 0, time.UTC)
	quotes := SaleQuoteDAOMock{
		CRUDMock: dao.CRUDMock[SaleQuote]{
			FindFunc: func(_ context.Context, _ uint64) (*SaleQuote, error) {
				return &SaleQuote{
					Base:           model.Base{ID: 7},
					OrganizationID: helper.Ptr(uint64(1)),
					State:          QuoteStateAccepted,
					ValidityDate:   &expired,
				}, nil
			},
		},
	}
	svc := SaleOrderService{quotes: quotes, now: func() time.Time {
		return time.Date(2026, time.October, 26, 0, 0, 0, 0, time.UTC)
	}}
	order := &SaleOrder{OrganizationID: helper.Ptr(uint64(1)), QuoteID: helper.Ptr(uint64(7))}
	lines := []*SaleOrderLine{}
	if err := svc.applyQuote(context.Background(), order, &lines); err != ErrQuoteExpired {
		t.Fatalf("error = %v, want ErrQuoteExpired", err)
	}
}

func TestSaleOrderService_AllowsOpenOpportunityFromAcceptedQuote(t *testing.T) {
	svc := testSaleOrderService(SaleOrderDAOMock{}, SaleOrderLineDAOMock{}, dao.CRUDMock[reference.Tax]{}, testPriceService(100))
	svc.leads = crm.ProspectDAOMock{
		CRUDMock: dao.CRUDMock[crm.Prospect]{
			FindFunc: func(_ context.Context, _ uint64) (*crm.Prospect, error) {
				return &crm.Prospect{
					Base:           model.Base{ID: 3},
					OrganizationID: helper.Ptr(uint64(1)),
					Type:           crm.ProspectKindOpportunity,
					Status:         crm.ProspectStatusQualified,
					StageID:        helper.Ptr(uint64(8)),
				}, nil
			},
		},
	}
	if err := svc.validateConversionLead(context.Background(), 1, 3); err != nil {
		t.Fatalf("validateConversionLead() error = %v", err)
	}
}

func TestSaleOrderService_RejectsLostOpportunityConversion(t *testing.T) {
	svc := testSaleOrderService(SaleOrderDAOMock{}, SaleOrderLineDAOMock{}, dao.CRUDMock[reference.Tax]{}, testPriceService(100))
	svc.leads = crm.ProspectDAOMock{
		CRUDMock: dao.CRUDMock[crm.Prospect]{
			FindFunc: func(_ context.Context, _ uint64) (*crm.Prospect, error) {
				return &crm.Prospect{
					Base:           model.Base{ID: 3},
					OrganizationID: helper.Ptr(uint64(1)),
					Type:           crm.ProspectKindOpportunity,
					Status:         crm.ProspectStatusLost,
					StageID:        helper.Ptr(uint64(8)),
					LostReason:     helper.Ptr("price"),
				}, nil
			},
		},
	}
	if err := svc.validateConversionLead(context.Background(), 1, 3); err != ErrOrderLeadLost {
		t.Fatalf("error = %v, want ErrOrderLeadLost", err)
	}
}

func TestSaleOrderService_RejectsDuplicateOpportunityOrder(t *testing.T) {
	orders := SaleOrderDAOMock{
		CRUDMock: dao.CRUDMock[SaleOrder]{
			ListFunc: func(_ context.Context, q *query.Query) (*query.Page[SaleOrder], error) {
				if len(q.Filters) != 2 {
					t.Fatalf("filters = %+v, want prospect and state filters", q.Filters)
				}
				return &query.Page[SaleOrder]{Items: []*SaleOrder{{Base: model.Base{ID: 20}}}}, nil
			},
		},
	}
	svc := testSaleOrderService(orders, SaleOrderLineDAOMock{}, dao.CRUDMock[reference.Tax]{}, testPriceService(100))
	order := &SaleOrder{ProspectID: helper.Ptr(uint64(3))}
	if err := svc.validateSingleOpportunityOrder(context.Background(), order); err != ErrOrderLeadAlreadyConverted {
		t.Fatalf("error = %v, want ErrOrderLeadAlreadyConverted", err)
	}
	order.AllowMultipleOrders = true
	if err := svc.validateSingleOpportunityOrder(context.Background(), order); err != nil {
		t.Fatalf("override error = %v, want nil", err)
	}
}
