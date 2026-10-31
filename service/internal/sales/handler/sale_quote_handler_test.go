package handler

import (
	"context"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/crm"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/kernel/sequence"
	"github.com/jalusw/swantara/apps/service/internal/products"
	"github.com/jalusw/swantara/apps/service/internal/reference"
	"github.com/jalusw/swantara/apps/service/internal/sales"
)

func saleQuoteHandlerTest(t *testing.T, svc sales.SaleQuoteService) *fiber.App {
	t.Helper()
	app := fiber.New()
	app.Use(func(c fiber.Ctx) error {
		c.Locals(model.ActorKey, uint64(5))
		c.Locals("organization_id", uint64(10))
		return c.Next()
	})
	h := NewSaleQuoteHandler(svc)
	h.Register(app, passthroughGuards())
	return app
}

func testSaleQuoteHandlerService(quotes sales.SaleQuoteDAOMock, lines sales.SaleQuoteLineDAOMock) sales.SaleQuoteService {
	sequences := sequence.NewService(sales.SequenceDAOMock{
		ReserveFunc: func(_ context.Context, _ uint64, _ string, _ time.Time) (*sequence.Reservation, error) {
			return &sequence.Reservation{Value: 1, Number: "SQ/00001"}, nil
		},
	})
	return sales.NewSaleQuoteService(
		sales.SaleQuoteRepositories{
			Quotes: quotes,
			Lines:  lines,
			PriceBooks: products.PriceBookDAOMock{
				CRUDMock: dao.CRUDMock[products.PriceBook]{
					FindFunc: func(_ context.Context, _ uint64) (*products.PriceBook, error) {
						return &products.PriceBook{Base: model.Base{ID: 2}, Name: "Retail", CurrencyCode: helper.Ptr("IDR")}, nil
					},
				},
			},
			Taxes:    dao.CRUDMock[reference.Tax]{},
			Contacts: defaultContact(),
			Leads: crm.ProspectDAOMock{
				CRUDMock: dao.CRUDMock[crm.Prospect]{
					FindFunc: func(_ context.Context, _ uint64) (*crm.Prospect, error) {
						return &crm.Prospect{Base: model.Base{ID: 3}, Type: crm.ProspectKindOpportunity, Status: crm.ProspectStatusQualified, ContactID: helper.Ptr(uint64(5))}, nil
					},
				},
			},
		},
		sales.SaleQuoteEngines{
			Sequences: sequences,
			Product:   handlerTestPriceService(100),
		},
	)
}

func TestSaleQuoteHandler_Create(t *testing.T) {
	quotes := sales.SaleQuoteDAOMock{
		CreateWithLinesFunc: func(_ context.Context, quote *sales.SaleQuote, lines []*sales.SaleQuoteLine) (*sales.SaleQuote, error) {
			quote.ID = 7
			for i, line := range lines {
				line.ID = uint64(i + 1)
				line.QuoteID = quote.ID
			}
			return quote, nil
		},
	}
	app := saleQuoteHandlerTest(t, testSaleQuoteHandlerService(quotes, sales.SaleQuoteLineDAOMock{}))

	body := `{"contact_id":5,"price_book_id":2,"lines":[{"item_id":100,"qty":2}]}`
	resp, err := doRequest(app, http.MethodPost, "/sale-quotes", body)
	if err != nil {
		t.Fatalf("request error = %v", err)
	}
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("status = %d, want 201", resp.StatusCode)
	}
	defer resp.Body.Close()
	payload, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("read body error = %v", err)
	}
	if !strings.Contains(string(payload), `"name":"SQ/00001"`) {
		t.Fatalf("body missing quote name: %s", payload)
	}
}

func TestSaleQuoteHandler_Get(t *testing.T) {
	quotes := sales.SaleQuoteDAOMock{
		CRUDMock: dao.CRUDMock[sales.SaleQuote]{
			FindFunc: func(_ context.Context, _ uint64) (*sales.SaleQuote, error) {
				return &sales.SaleQuote{Base: model.Base{ID: 7}, OrganizationID: helper.Ptr(uint64(10)), State: sales.QuoteStateDraft}, nil
			},
		},
	}
	lines := sales.SaleQuoteLineDAOMock{
		ListByQuoteFunc: func(_ context.Context, _ uint64) ([]*sales.SaleQuoteLine, error) {
			return []*sales.SaleQuoteLine{{Base: model.Base{ID: 1}, QuoteID: 7, ItemID: helper.Ptr(uint64(100)), Qty: 2, UnitPrice: 50}}, nil
		},
	}
	app := saleQuoteHandlerTest(t, testSaleQuoteHandlerService(quotes, lines))

	resp, err := doRequest(app, http.MethodGet, "/sale-quotes/7", "")
	if err != nil {
		t.Fatalf("request error = %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
	defer resp.Body.Close()
	payload, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("read body error = %v", err)
	}
	if !strings.Contains(string(payload), `"unit_price":50`) {
		t.Fatalf("body missing line: %s", payload)
	}
}

func TestSaleQuoteHandler_AcceptRejectsDraft(t *testing.T) {
	quotes := sales.SaleQuoteDAOMock{
		CRUDMock: dao.CRUDMock[sales.SaleQuote]{
			FindFunc: func(_ context.Context, _ uint64) (*sales.SaleQuote, error) {
				return &sales.SaleQuote{Base: model.Base{ID: 7}, OrganizationID: helper.Ptr(uint64(10)), State: sales.QuoteStateDraft, IsCurrent: true}, nil
			},
		},
	}
	app := saleQuoteHandlerTest(t, testSaleQuoteHandlerService(quotes, sales.SaleQuoteLineDAOMock{}))

	resp, err := doRequest(app, http.MethodPost, "/sale-quotes/7/accept", "")
	if err != nil {
		t.Fatalf("request error = %v", err)
	}
	if resp.StatusCode != http.StatusConflict {
		t.Fatalf("status = %d, want 409", resp.StatusCode)
	}
}

func TestSaleQuoteHandler_NotFound(t *testing.T) {
	quotes := sales.SaleQuoteDAOMock{
		CRUDMock: dao.CRUDMock[sales.SaleQuote]{
			FindFunc: func(_ context.Context, _ uint64) (*sales.SaleQuote, error) {
				return nil, dao.ErrNotFound
			},
		},
	}
	app := saleQuoteHandlerTest(t, testSaleQuoteHandlerService(quotes, sales.SaleQuoteLineDAOMock{}))

	resp, err := doRequest(app, http.MethodGet, "/sale-quotes/404", "")
	if err != nil {
		t.Fatalf("request error = %v", err)
	}
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", resp.StatusCode)
	}
}
