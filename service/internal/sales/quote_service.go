package sales

import (
	"context"
	"errors"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/contacts"
	"github.com/jalusw/swantara/apps/service/internal/crm"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/kernel/amount"
	"github.com/jalusw/swantara/apps/service/internal/kernel/clock"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/kernel/scope"
	"github.com/jalusw/swantara/apps/service/internal/kernel/sequence"
	"github.com/jalusw/swantara/apps/service/internal/kernel/state"
	"github.com/jalusw/swantara/apps/service/internal/products"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type SaleQuoteService struct {
	quotes      SaleQuoteDAO
	lines       SaleQuoteLineDAO
	price_books products.PriceBookDAO
	taxes       dao.CRUD[reference.Tax]
	contacts    contacts.ContactDAO
	leads       crm.ProspectDAO
	sequences   sequence.Service
	productSvc  products.ProductService
	controls    *SalesControls
	machine     state.Machine
	now         func() time.Time
}

type SaleQuoteRepositories struct {
	Quotes     SaleQuoteDAO
	Lines      SaleQuoteLineDAO
	PriceBooks products.PriceBookDAO
	Taxes      dao.CRUD[reference.Tax]
	Contacts   contacts.ContactDAO
	Leads      crm.ProspectDAO
}

type SaleQuoteEngines struct {
	Sequences sequence.Service
	Product   products.ProductService
}

func NewSaleQuoteService(repos SaleQuoteRepositories, engines SaleQuoteEngines) SaleQuoteService {
	return SaleQuoteService{
		now:         clock.Now,
		quotes:      repos.Quotes,
		lines:       repos.Lines,
		price_books: repos.PriceBooks,
		taxes:       repos.Taxes,
		contacts:    repos.Contacts,
		leads:       repos.Leads,
		sequences:   engines.Sequences,
		productSvc:  engines.Product,
		machine: state.NewMachine(
			state.Transition{From: model.Status(QuoteStateDraft), To: model.Status(QuoteStateSent)},
			state.Transition{From: model.Status(QuoteStateDraft), To: model.Status(QuoteStateCancelled)},
			state.Transition{From: model.Status(QuoteStateSent), To: model.Status(QuoteStateAccepted)},
			state.Transition{From: model.Status(QuoteStateSent), To: model.Status(QuoteStateExpired)},
			state.Transition{From: model.Status(QuoteStateSent), To: model.Status(QuoteStateCancelled)},
		),
	}
}

func (s SaleQuoteService) WithClock(now func() time.Time) SaleQuoteService {
	s.now = now
	return s
}

func (s SaleQuoteService) WithControls(controls SalesControls) SaleQuoteService {
	s.controls = &controls
	return s
}

func (s SaleQuoteService) Create(ctx context.Context, quote *SaleQuote, lines []*SaleQuoteLine) (*SaleQuote, error) {
	if quote.OrganizationID == nil {
		return nil, ErrQuoteContact
	}
	if len(lines) == 0 {
		return nil, ErrQuoteNoLines
	}
	if quote.PriceBookID == nil {
		return nil, ErrQuotePriceBook
	}
	if quote.ProspectID != nil {
		if err := s.applyOpportunityDefaults(ctx, quote); err != nil {
			return nil, err
		}
	}
	if err := s.validateContact(ctx, quote.OrganizationID, quote.ContactID); err != nil {
		return nil, err
	}
	if err := s.validatePriceBook(ctx, quote.OrganizationID, *quote.PriceBookID); err != nil {
		return nil, err
	}

	date := s.now()
	if quote.QuoteDate != nil {
		date = *quote.QuoteDate
	}

	untaxed := amount.Zero()
	tax := amount.Zero()
	for _, line := range lines {
		if line.ItemID == nil {
			return nil, ErrQuoteVariant
		}
		if !amount.FromFloat64(line.Qty).GreaterThan(amount.Zero()) {
			return nil, ErrQuoteQty
		}
		if line.DiscountPct < 0 || line.DiscountPct > 100 {
			return nil, ErrQuoteDiscount
		}
		if err := s.validateLineProduct(ctx, quote.OrganizationID, *line.ItemID); err != nil {
			return nil, err
		}
		if line.UnitPrice == 0 {
			resolved, err := s.productSvc.ResolvePrice(ctx, *quote.PriceBookID, *line.ItemID, amount.FromFloat64(line.Qty), date)
			if err != nil {
				return nil, err
			}
			line.UnitPrice = resolved.Price.Float64()
		}
		if err := s.resolveLineAmounts(ctx, quote.OrganizationID, line); err != nil {
			return nil, err
		}
		untaxed = untaxed.Add(amount.FromFloat64(line.PriceSubtotal))
		tax = tax.Add(amount.FromFloat64(line.PriceTax))
	}

	name, err := s.sequences.Next(ctx, *quote.OrganizationID, SequenceSaleQuoteCode)
	if err != nil {
		if errors.Is(err, sequence.ErrSequenceNotFound) {
			return nil, ErrQuoteSequenceNotFound
		}
		return nil, err
	}
	quote.Name = helper.Ptr(name)
	quote.AmountUntaxed = untaxed.Round(4).Float64()
	quote.AmountTax = tax.Round(4).Float64()
	quote.AmountTotal = untaxed.Add(tax).Round(4).Float64()
	quote.State = QuoteStateDraft
	if quote.Version == 0 {
		quote.Version = 1
	}
	quote.IsCurrent = true
	if quote.CurrencyCode == nil {
		if priceBook, err := s.price_books.Find(ctx, *quote.PriceBookID); err == nil && priceBook != nil {
			quote.CurrencyCode = priceBook.CurrencyCode
		}
	}

	return s.quotes.CreateWithLines(ctx, quote, lines)
}

func (s SaleQuoteService) UpdateDraft(ctx context.Context, quoteID uint64, quote *SaleQuote, lines []*SaleQuoteLine) (*SaleQuote, error) {
	existing, err := s.findQuote(ctx, quoteID)
	if err != nil {
		return nil, err
	}
	if existing.State != QuoteStateDraft || !existing.IsCurrent {
		return nil, ErrQuoteState
	}
	if len(lines) == 0 {
		return nil, ErrQuoteNoLines
	}
	if quote.PriceBookID == nil {
		return nil, ErrQuotePriceBook
	}
	if quote.ProspectID != nil {
		organizationID := existing.OrganizationID
		quote.OrganizationID = organizationID
		if err := s.applyOpportunityDefaults(ctx, quote); err != nil {
			return nil, err
		}
	}
	if err := s.validateContact(ctx, existing.OrganizationID, quote.ContactID); err != nil {
		return nil, err
	}
	if err := s.validatePriceBook(ctx, existing.OrganizationID, *quote.PriceBookID); err != nil {
		return nil, err
	}

	date := s.now()
	if quote.QuoteDate != nil {
		date = *quote.QuoteDate
	}

	untaxed := amount.Zero()
	tax := amount.Zero()
	for _, line := range lines {
		if line.ItemID == nil {
			return nil, ErrQuoteVariant
		}
		if !amount.FromFloat64(line.Qty).GreaterThan(amount.Zero()) {
			return nil, ErrQuoteQty
		}
		if line.DiscountPct < 0 || line.DiscountPct > 100 {
			return nil, ErrQuoteDiscount
		}
		if err := s.validateLineProduct(ctx, existing.OrganizationID, *line.ItemID); err != nil {
			return nil, err
		}
		if line.UnitPrice == 0 {
			resolved, err := s.productSvc.ResolvePrice(ctx, *quote.PriceBookID, *line.ItemID, amount.FromFloat64(line.Qty), date)
			if err != nil {
				return nil, err
			}
			line.UnitPrice = resolved.Price.Float64()
		}
		if err := s.resolveLineAmounts(ctx, existing.OrganizationID, line); err != nil {
			return nil, err
		}
		untaxed = untaxed.Add(amount.FromFloat64(line.PriceSubtotal))
		tax = tax.Add(amount.FromFloat64(line.PriceTax))
	}

	quote.ID = existing.ID
	quote.OrganizationID = existing.OrganizationID
	quote.Name = existing.Name
	quote.CurrencyCode = existing.CurrencyCode
	quote.ExpectedRevenue = existing.ExpectedRevenue
	quote.Version = existing.Version
	quote.RootQuoteID = existing.RootQuoteID
	quote.PreviousQuoteID = existing.PreviousQuoteID
	quote.IsCurrent = existing.IsCurrent
	quote.AcceptedAt = existing.AcceptedAt
	quote.SaleOrderID = existing.SaleOrderID
	quote.State = QuoteStateDraft
	quote.AmountUntaxed = untaxed.Round(4).Float64()
	quote.AmountTax = tax.Round(4).Float64()
	quote.AmountTotal = untaxed.Add(tax).Round(4).Float64()

	if err := s.lines.ReplaceLines(ctx, quoteID, lines); err != nil {
		return nil, err
	}
	updated, err := s.quotes.Update(ctx, quote)
	if err != nil {
		return nil, err
	}
	if s.controls != nil {
		if err := s.controls.Invalidate(ctx, ApprovalOwnerTypeSaleQuote, quoteID); err != nil {
			return nil, err
		}
	}
	return updated, nil
}

func (s SaleQuoteService) Send(ctx context.Context, quoteID uint64) (*SaleQuote, error) {
	quote, err := s.findQuote(ctx, quoteID)
	if err != nil {
		return nil, err
	}
	if !quote.IsCurrent {
		return nil, ErrQuoteState
	}
	if err := s.machine.TryTransition(model.Status(quote.State), model.Status(QuoteStateSent)); err != nil {
		return nil, ErrQuoteState
	}
	quote.State = QuoteStateSent
	return s.quotes.Update(ctx, quote)
}

func (s SaleQuoteService) Accept(ctx context.Context, quoteID uint64) (*SaleQuote, error) {
	quote, err := s.findQuote(ctx, quoteID)
	if err != nil {
		return nil, err
	}
	if !quote.IsCurrent {
		return nil, ErrQuoteState
	}
	if s.isExpired(quote) {
		return nil, ErrQuoteExpired
	}
	if err := s.machine.TryTransition(model.Status(quote.State), model.Status(QuoteStateAccepted)); err != nil {
		return nil, ErrQuoteState
	}
	if s.controls != nil && quote.OrganizationID != nil {
		lines, err := s.lines.ListByQuote(ctx, quoteID)
		if err != nil {
			return nil, err
		}
		if err := s.controls.Enforce(ctx, *quote.OrganizationID, ApprovalOwnerTypeSaleQuote, quote.ID, quote.ContactID, quote.AmountTotal, quote.PaymentTermID, maxQuoteLineDiscount(lines)); err != nil {
			return nil, err
		}
	}
	now := s.now()
	quote.State = QuoteStateAccepted
	quote.AcceptedAt = &now
	return s.quotes.Update(ctx, quote)
}

func (s SaleQuoteService) Cancel(ctx context.Context, quoteID uint64) (*SaleQuote, error) {
	quote, err := s.findQuote(ctx, quoteID)
	if err != nil {
		return nil, err
	}
	if !quote.IsCurrent {
		return nil, ErrQuoteState
	}
	if err := s.machine.TryTransition(model.Status(quote.State), model.Status(QuoteStateCancelled)); err != nil {
		return nil, ErrQuoteState
	}
	quote.State = QuoteStateCancelled
	return s.quotes.Update(ctx, quote)
}

func (s SaleQuoteService) Expire(ctx context.Context, quoteID uint64) (*SaleQuote, error) {
	quote, err := s.findQuote(ctx, quoteID)
	if err != nil {
		return nil, err
	}
	if !quote.IsCurrent {
		return nil, ErrQuoteState
	}
	if err := s.machine.TryTransition(model.Status(quote.State), model.Status(QuoteStateExpired)); err != nil {
		return nil, ErrQuoteState
	}
	quote.State = QuoteStateExpired
	return s.quotes.Update(ctx, quote)
}

func (s SaleQuoteService) Delete(ctx context.Context, quoteID uint64) error {
	quote, err := s.findQuote(ctx, quoteID)
	if err != nil {
		return err
	}
	if quote.SaleOrderID != nil {
		return ErrQuoteState
	}
	return s.quotes.Delete(ctx, quoteID)
}

func (s SaleQuoteService) Revise(ctx context.Context, quoteID uint64, quote *SaleQuote, lines []*SaleQuoteLine) (*SaleQuote, error) {
	existing, err := s.findQuote(ctx, quoteID)
	if err != nil {
		return nil, err
	}
	if !existing.IsCurrent {
		return nil, ErrQuoteState
	}
	if existing.State == QuoteStateAccepted {
		return nil, ErrQuoteState
	}
	if len(lines) == 0 {
		lines, err = s.lines.ListByQuote(ctx, quoteID)
		if err != nil {
			return nil, err
		}
		for _, line := range lines {
			line.ID = 0
			line.QuoteID = 0
		}
	}
	if len(lines) == 0 {
		return nil, ErrQuoteNoLines
	}
	if quote.ContactID == 0 {
		quote.ContactID = existing.ContactID
	}
	if quote.PriceBookID == nil {
		quote.PriceBookID = existing.PriceBookID
	}
	if quote.ProspectID == nil {
		quote.ProspectID = existing.ProspectID
	}
	if quote.QuoteDate == nil {
		quote.QuoteDate = existing.QuoteDate
	}
	if quote.ValidityDate == nil {
		quote.ValidityDate = existing.ValidityDate
	}
	if quote.PaymentTermID == nil {
		quote.PaymentTermID = existing.PaymentTermID
	}
	if quote.Incoterm == nil {
		quote.Incoterm = existing.Incoterm
	}
	if quote.CustomerPORef == nil {
		quote.CustomerPORef = existing.CustomerPORef
	}
	if quote.CurrencyCode == nil {
		quote.CurrencyCode = existing.CurrencyCode
	}
	if quote.ExpectedRevenue == nil {
		quote.ExpectedRevenue = existing.ExpectedRevenue
	}
	if quote.Note == nil {
		quote.Note = existing.Note
	}
	if quote.SalespersonID == nil {
		quote.SalespersonID = existing.SalespersonID
	}
	if quote.SalesGroupID == nil {
		quote.SalesGroupID = existing.SalesGroupID
	}
	quote.OrganizationID = existing.OrganizationID
	quote.Version = existing.Version + 1
	rootID := existing.ID
	if existing.RootQuoteID != nil {
		rootID = *existing.RootQuoteID
	}
	previousID := existing.ID
	quote.RootQuoteID = &rootID
	quote.PreviousQuoteID = &previousID
	quote.IsCurrent = true

	created, err := s.Create(ctx, quote, lines)
	if err != nil {
		return nil, err
	}
	existing.IsCurrent = false
	if _, err := s.quotes.Update(ctx, existing); err != nil {
		return nil, err
	}
	return created, nil
}

func (s SaleQuoteService) MarkConverted(ctx context.Context, quoteID, orderID uint64) (*SaleQuote, error) {
	quote, err := s.findQuote(ctx, quoteID)
	if err != nil {
		return nil, err
	}
	quote.SaleOrderID = helper.Ptr(orderID)
	return s.quotes.Update(ctx, quote)
}

func (s SaleQuoteService) ListHistory(ctx context.Context, quoteID uint64) ([]*SaleQuote, error) {
	quote, err := s.findQuote(ctx, quoteID)
	if err != nil {
		return nil, err
	}
	rootID := quote.ID
	if quote.RootQuoteID != nil {
		rootID = *quote.RootQuoteID
	}
	return s.quotes.ListHistory(ctx, rootID)
}

func (s SaleQuoteService) ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[SaleQuote], error) {
	return s.quotes.List(ctx, scope.ToOrg(q, organizationID))
}

func (s SaleQuoteService) FindInOrg(ctx context.Context, id, organizationID uint64) (*SaleQuote, error) {
	quote, err := s.Find(ctx, id)
	if err != nil {
		return nil, dao.NotFound(err, ErrQuoteNotFound)
	}
	if quote == nil || !scope.Owns(quote.OrganizationID, organizationID) {
		return nil, ErrQuoteNotFound
	}
	return quote, nil
}

func (s SaleQuoteService) Find(ctx context.Context, id uint64) (*SaleQuote, error) {
	return s.quotes.Find(ctx, id)
}

func (s SaleQuoteService) ListLines(ctx context.Context, quoteID uint64) ([]*SaleQuoteLine, error) {
	return s.lines.ListByQuote(ctx, quoteID)
}

func (s SaleQuoteService) findQuote(ctx context.Context, quoteID uint64) (*SaleQuote, error) {
	quote, err := s.quotes.Find(ctx, quoteID)
	if err != nil {
		return nil, dao.NotFound(err, ErrQuoteNotFound)
	}
	if quote == nil {
		return nil, ErrQuoteNotFound
	}
	return quote, nil
}

func (s SaleQuoteService) isExpired(quote *SaleQuote) bool {
	if quote.ValidityDate == nil {
		return false
	}
	today := s.now().UTC().Truncate(24 * time.Hour)
	return quote.ValidityDate.Before(today)
}

func (s SaleQuoteService) validateContact(ctx context.Context, organizationID *uint64, contactID uint64) error {
	contact, err := s.contacts.Find(ctx, contactID)
	if err != nil {
		return dao.NotFound(err, ErrQuoteContact)
	}
	if contact == nil {
		return ErrQuoteContact
	}
	if organizationID != nil && contact.OrganizationID != nil && *contact.OrganizationID != *organizationID {
		return ErrQuoteContactOrganization
	}
	return nil
}

func (s SaleQuoteService) validatePriceBook(ctx context.Context, organizationID *uint64, priceBookID uint64) error {
	priceBook, err := s.price_books.Find(ctx, priceBookID)
	if err != nil {
		return dao.NotFound(err, ErrQuotePriceBook)
	}
	if priceBook == nil {
		return ErrQuotePriceBook
	}
	if organizationID != nil && priceBook.OrganizationID != nil && *priceBook.OrganizationID != *organizationID {
		return ErrQuotePriceBookOrganization
	}
	return nil
}

func (s SaleQuoteService) validateLineProduct(ctx context.Context, organizationID *uint64, variantID uint64) error {
	variantOrg, err := s.productSvc.ResolveVariantOrganization(ctx, variantID)
	if err != nil {
		return err
	}
	if organizationID != nil && variantOrg != nil && *variantOrg != *organizationID {
		return ErrQuoteVariantOrganization
	}
	return nil
}

func (s SaleQuoteService) applyOpportunityDefaults(ctx context.Context, quote *SaleQuote) error {
	lead, err := s.leads.Find(ctx, *quote.ProspectID)
	if err != nil {
		return dao.NotFound(err, ErrQuoteLead)
	}
	if lead == nil {
		return ErrQuoteLead
	}
	if quote.OrganizationID != nil && lead.OrganizationID != nil && *lead.OrganizationID != *quote.OrganizationID {
		return ErrQuoteLeadOrganization
	}
	if lead.Type != crm.ProspectKindOpportunity {
		return ErrQuoteLeadInvalid
	}
	if lead.Status == crm.ProspectStatusLost || lead.Status == crm.ProspectStatusDisqualified || lead.LostReason != nil {
		return ErrQuoteLeadClosed
	}

	if quote.ContactID == 0 && lead.ContactID != nil {
		quote.ContactID = *lead.ContactID
	}
	if quote.CurrencyCode == nil && lead.CurrencyCode != "" {
		currency := lead.CurrencyCode
		quote.CurrencyCode = &currency
	}
	if quote.ExpectedRevenue == nil {
		expected := lead.ExpectedRevenue
		quote.ExpectedRevenue = &expected
	}
	if quote.SalespersonID == nil {
		quote.SalespersonID = lead.SalespersonID
	}
	if quote.SalesGroupID == nil {
		quote.SalesGroupID = lead.SalesGroupID
	}
	if quote.ValidityDate == nil {
		quote.ValidityDate = lead.ExpectedClose
	}
	return nil
}

func (s SaleQuoteService) resolveLineAmounts(ctx context.Context, organizationID *uint64, line *SaleQuoteLine) error {
	qty := amount.FromFloat64(line.Qty)
	discount := amount.FromFloat64(1 - line.DiscountPct/100)
	subtotal := qty.Mul(amount.FromFloat64(line.UnitPrice)).Mul(discount).Round(4)
	lineTax := amount.Zero()

	for _, taxID := range line.TaxIDs {
		tax, err := s.taxes.Find(ctx, uint64(taxID))
		if err != nil {
			return dao.NotFound(err, ErrQuoteTax)
		}
		if tax == nil {
			return ErrQuoteTax
		}
		if organizationID != nil && tax.OrganizationID != nil && *tax.OrganizationID != *organizationID {
			return ErrQuoteTaxOrganization
		}
		if tax.Scope != reference.TaxScopeSale && tax.Scope != reference.TaxScopeNone {
			return ErrQuoteTaxInvalid
		}
		taxAmount, err := reference.TaxLineAmount(subtotal, qty, tax)
		if err != nil {
			return err
		}
		lineTax = lineTax.Add(taxAmount)
	}

	line.PriceSubtotal = subtotal.Float64()
	line.PriceTax = lineTax.Round(4).Float64()
	line.PriceTotal = subtotal.Add(lineTax).Round(4).Float64()
	return nil
}
