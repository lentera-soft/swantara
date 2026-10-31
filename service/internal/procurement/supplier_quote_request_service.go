package procurement

import (
	"context"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/contacts"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/kernel/amount"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/kernel/scope"
	"github.com/jalusw/swantara/apps/service/internal/kernel/sequence"
	"github.com/jalusw/swantara/apps/service/internal/kernel/state"

	"github.com/jalusw/swantara/apps/service/internal/kernel/clock"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type SupplierQuoteRequestService struct {
	quoteRequests     SupplierQuoteRequestDAO
	quoteRequestLines SupplierQuoteRequestLineDAO
	quotes            SupplierQuoteDAO
	quoteLines        SupplierQuoteLineDAO
	requisitions      PurchaseRequestDAO
	requisitionLines  PurchaseRequestLineDAO
	sequences         sequence.Service
	contacts          contacts.ContactDAO
	orders            OrderCreator
	machine           state.Machine
	quoteMachine      state.Machine
	now               func() time.Time
}

func NewSupplierQuoteRequestService(
	quoteRequests SupplierQuoteRequestDAO,
	quoteRequestLines SupplierQuoteRequestLineDAO,
	quotes SupplierQuoteDAO,
	quoteLines SupplierQuoteLineDAO,
	requisitions PurchaseRequestDAO,
	requisitionLines PurchaseRequestLineDAO,
	sequences sequence.Service,
	contacts contacts.ContactDAO,
	orders OrderCreator,
) SupplierQuoteRequestService {
	return SupplierQuoteRequestService{
		now:               clock.Now,
		quoteRequests:     quoteRequests,
		quoteRequestLines: quoteRequestLines,
		quotes:            quotes,
		quoteLines:        quoteLines,
		requisitions:      requisitions,
		requisitionLines:  requisitionLines,
		sequences:         sequences,
		contacts:          contacts,
		orders:            orders,
		machine: state.NewMachine(
			state.Transition{From: model.Status(SupplierQuoteRequestStateDraft), To: model.Status(SupplierQuoteRequestStateSent)},
			state.Transition{From: model.Status(SupplierQuoteRequestStateDraft), To: model.Status(SupplierQuoteRequestStateCancelled)},
			state.Transition{From: model.Status(SupplierQuoteRequestStateSent), To: model.Status(SupplierQuoteRequestStateDone)},
			state.Transition{From: model.Status(SupplierQuoteRequestStateSent), To: model.Status(SupplierQuoteRequestStateCancelled)},
		),
		quoteMachine: state.NewMachine(
			state.Transition{From: model.Status(SupplierQuoteStateSubmitted), To: model.Status(SupplierQuoteStateAccepted)},
			state.Transition{From: model.Status(SupplierQuoteStateSubmitted), To: model.Status(SupplierQuoteStateRejected)},
		),
	}
}

func (s SupplierQuoteRequestService) WithClock(now func() time.Time) SupplierQuoteRequestService {
	s.now = now
	return s
}

func (s SupplierQuoteRequestService) Create(ctx context.Context, quoteRequest *SupplierQuoteRequest, lines []*SupplierQuoteRequestLine) (*SupplierQuoteRequest, error) {
	if quoteRequest.OrganizationID == nil {
		return nil, ErrQuoteRequestNotFound
	}
	if len(lines) == 0 {
		return nil, ErrQuoteRequestNoLines
	}
	if err := s.validateRequester(ctx, quoteRequest.RequesterID); err != nil {
		return nil, err
	}
	for _, line := range lines {
		if !amount.FromFloat64(line.Qty).GreaterThan(amount.Zero()) {
			return nil, ErrQuoteRequestLineQty
		}
	}

	name, err := s.sequences.Next(ctx, *quoteRequest.OrganizationID, SequenceSupplierQuoteRequestCode)
	if err != nil {
		return nil, err
	}
	quoteRequest.Name = helper.Ptr(name)
	quoteRequest.State = SupplierQuoteRequestStateDraft
	if quoteRequest.CurrencyCode == nil {
		quoteRequest.CurrencyCode = helper.Ptr("IDR")
	}
	return s.quoteRequests.CreateWithLines(ctx, quoteRequest, lines)
}

func (s SupplierQuoteRequestService) CreateFromRequest(ctx context.Context, requestID uint64, quoteRequest *SupplierQuoteRequest) (*SupplierQuoteRequest, error) {
	requisition, err := s.requisitions.Find(ctx, requestID)
	if err != nil {
		return nil, dao.NotFound(err, ErrRequisitionNotFound)
	}
	if requisition == nil {
		return nil, ErrRequisitionNotFound
	}
	if requisition.State != RequestStateApproved {
		return nil, ErrRequisitionNotConvertible
	}
	requisitionLines, err := s.requisitionLines.ListByRequest(ctx, requestID)
	if err != nil {
		return nil, err
	}
	if len(requisitionLines) == 0 {
		return nil, ErrRequisitionNoLines
	}

	lines := make([]*SupplierQuoteRequestLine, 0, len(requisitionLines))
	for _, requisitionLine := range requisitionLines {
		if requisitionLine.ItemID == nil {
			continue
		}
		lines = append(lines, &SupplierQuoteRequestLine{
			ItemID:      requisitionLine.ItemID,
			Description: requisitionLine.Description,
			Qty:         requisitionLine.Qty,
			UnitID:      requisitionLine.UnitID,
			NeededBy:    requisitionLine.NeededBy,
		})
	}
	if len(lines) == 0 {
		return nil, ErrQuoteRequestNoLines
	}
	if quoteRequest.OrganizationID == nil {
		quoteRequest.OrganizationID = requisition.OrganizationID
	}
	if quoteRequest.RequesterID == 0 {
		quoteRequest.RequesterID = requisition.RequesterID
	}
	return s.Create(ctx, quoteRequest, lines)
}

func (s SupplierQuoteRequestService) Send(ctx context.Context, quoteRequestID uint64) (*SupplierQuoteRequest, error) {
	quoteRequest, err := s.findQuoteRequest(ctx, quoteRequestID)
	if err != nil {
		return nil, err
	}
	if err := s.machine.TryTransition(model.Status(quoteRequest.State), model.Status(SupplierQuoteRequestStateSent)); err != nil {
		return nil, ErrSupplierQuoteRequestState
	}
	quoteRequest.State = SupplierQuoteRequestStateSent
	return s.quoteRequests.Update(ctx, quoteRequest)
}

func (s SupplierQuoteRequestService) Cancel(ctx context.Context, quoteRequestID uint64) (*SupplierQuoteRequest, error) {
	quoteRequest, err := s.findQuoteRequest(ctx, quoteRequestID)
	if err != nil {
		return nil, err
	}
	if err := s.machine.TryTransition(model.Status(quoteRequest.State), model.Status(SupplierQuoteRequestStateCancelled)); err != nil {
		return nil, ErrSupplierQuoteRequestState
	}
	quoteRequest.State = SupplierQuoteRequestStateCancelled
	return s.quoteRequests.Update(ctx, quoteRequest)
}

func (s SupplierQuoteRequestService) List(ctx context.Context, q *query.Query) (*query.Page[SupplierQuoteRequest], error) {
	return s.quoteRequests.List(ctx, q)
}

func (s SupplierQuoteRequestService) Find(ctx context.Context, id uint64) (*SupplierQuoteRequest, error) {
	return s.quoteRequests.Find(ctx, id)
}

func (s SupplierQuoteRequestService) ListLines(ctx context.Context, quoteRequestID uint64) ([]*SupplierQuoteRequestLine, error) {
	return s.quoteRequestLines.ListByQuoteRequest(ctx, quoteRequestID)
}

func (s SupplierQuoteRequestService) ListQuotes(ctx context.Context, quoteRequestID uint64) ([]*SupplierQuote, error) {
	page, err := s.quotes.List(ctx, &query.Query{Filters: []query.Filter{{Field: "quote_request_id", Operator: query.Equal, Value: quoteRequestID}}})
	if err != nil {
		return nil, err
	}
	return page.Items, nil
}

func (s SupplierQuoteRequestService) SubmitQuote(ctx context.Context, quoteRequestID uint64, quote *SupplierQuote, lines []*SupplierQuoteLine) (*SupplierQuote, error) {
	quoteRequest, err := s.findQuoteRequest(ctx, quoteRequestID)
	if err != nil {
		return nil, err
	}
	if quoteRequest.State != SupplierQuoteRequestStateSent {
		return nil, ErrSupplierQuoteRequestState
	}
	if quote.SupplierID == 0 {
		return nil, ErrSupplierQuoteVendor
	}
	supplier, err := s.contacts.Find(ctx, quote.SupplierID)
	if err != nil {
		return nil, dao.NotFound(err, ErrSupplierQuoteVendor)
	}
	if supplier == nil {
		return nil, ErrSupplierQuoteVendor
	}
	if len(lines) == 0 {
		return nil, ErrSupplierQuoteNoLines
	}

	quoteRequestLines, err := s.quoteRequestLines.ListByQuoteRequest(ctx, quoteRequestID)
	if err != nil {
		return nil, err
	}
	known := map[uint64]bool{}
	for _, quoteRequestLine := range quoteRequestLines {
		known[quoteRequestLine.ID] = true
	}

	untaxed := amount.Zero()
	for _, line := range lines {
		if !amount.FromFloat64(line.Qty).GreaterThan(amount.Zero()) {
			return nil, ErrSupplierQuoteLineQty
		}
		if !known[line.QuoteRequestLineID] {
			return nil, ErrSupplierQuoteDuplicateLine
		}
		if line.UnitPrice < 0 {
			return nil, ErrSupplierQuotePrice
		}
		subtotal := amount.FromFloat64(line.Qty).Mul(amount.FromFloat64(line.UnitPrice)).Round(4)
		line.PriceSubtotal = subtotal.Float64()
		untaxed = untaxed.Add(subtotal)
	}
	quote.QuoteRequestID = quoteRequestID
	quote.State = SupplierQuoteStateSubmitted
	quote.AmountUntaxed = untaxed.Float64()
	quote.AmountTotal = untaxed.Float64()
	if quote.CurrencyCode == nil {
		quote.CurrencyCode = quoteRequest.CurrencyCode
	}
	if quote.QuoteDate == nil {
		now := s.now()
		quote.QuoteDate = &now
	}
	return s.quotes.CreateWithLines(ctx, quote, lines)
}

func (s SupplierQuoteRequestService) AcceptQuote(ctx context.Context, quoteID uint64) (*SupplierQuoteRequest, error) {
	quote, err := s.findQuote(ctx, quoteID)
	if err != nil {
		return nil, err
	}
	if err := s.quoteMachine.TryTransition(model.Status(quote.State), model.Status(SupplierQuoteStateAccepted)); err != nil {
		return nil, ErrSupplierQuoteState
	}
	quoteRequest, err := s.findQuoteRequest(ctx, quote.QuoteRequestID)
	if err != nil {
		return nil, err
	}
	if quoteRequest.State != SupplierQuoteRequestStateSent {
		return nil, ErrSupplierQuoteRequestState
	}

	quotesPage, err := s.quotes.List(ctx, &query.Query{Filters: []query.Filter{{Field: "quote_request_id", Operator: query.Equal, Value: quoteRequest.ID}}})
	if err != nil {
		return nil, err
	}
	for _, other := range quotesPage.Items {
		if other.ID == quote.ID {
			continue
		}
		if other.State == SupplierQuoteStateSubmitted {
			other.State = SupplierQuoteStateRejected
			if _, err := s.quotes.Update(ctx, other); err != nil {
				return nil, err
			}
		}
	}

	quote.State = SupplierQuoteStateAccepted
	if _, err := s.quotes.Update(ctx, quote); err != nil {
		return nil, err
	}

	quoteRequest.State = SupplierQuoteRequestStateDone
	return s.quoteRequests.Update(ctx, quoteRequest)
}

func (s SupplierQuoteRequestService) CreatePurchaseOrder(ctx context.Context, quoteRequestID uint64, order *PurchaseOrder) (*PurchaseOrder, error) {
	quoteRequest, err := s.findQuoteRequest(ctx, quoteRequestID)
	if err != nil {
		return nil, err
	}
	if quoteRequest.State != SupplierQuoteRequestStateDone {
		return nil, ErrQuoteRequestNotConvertible
	}

	quotesPage, err := s.quotes.List(ctx, &query.Query{Filters: []query.Filter{{Field: "quote_request_id", Operator: query.Equal, Value: quoteRequestID}}})
	if err != nil {
		return nil, err
	}
	var accepted *SupplierQuote
	for _, quote := range quotesPage.Items {
		if quote.State == SupplierQuoteStateAccepted {
			accepted = quote
			break
		}
	}
	if accepted == nil {
		return nil, ErrSupplierQuoteNoAccepted
	}

	quoteLines, err := s.quoteLines.ListByQuote(ctx, accepted.ID)
	if err != nil {
		return nil, err
	}
	if len(quoteLines) == 0 {
		return nil, ErrSupplierQuoteNoLines
	}
	lines := make([]*PurchaseOrderLine, 0, len(quoteLines))
	for _, quoteLine := range quoteLines {
		lines = append(lines, &PurchaseOrderLine{
			ItemID:        quoteLine.ItemID,
			Description:   quoteLine.Description,
			QtyOrdered:    quoteLine.Qty,
			UnitID:        nil,
			QtyReceived:   0,
			QtyBilled:     0,
			UnitPrice:     quoteLine.UnitPrice,
			DiscountPct:   quoteLine.DiscountPct,
			PriceSubtotal: quoteLine.PriceSubtotal,
		})
	}
	if order.OrganizationID == nil {
		order.OrganizationID = quoteRequest.OrganizationID
	}
	if order.SupplierID == 0 {
		order.SupplierID = accepted.SupplierID
	}
	return s.orders.Create(ctx, order, lines)
}

func (s SupplierQuoteRequestService) validateRequester(ctx context.Context, requesterID uint64) error {
	if requesterID == 0 {
		return ErrQuoteRequestRequester
	}
	requester, err := s.contacts.Find(ctx, requesterID)
	if err != nil {
		return dao.NotFound(err, ErrQuoteRequestRequester)
	}
	if requester == nil {
		return ErrQuoteRequestRequester
	}
	return nil
}

func (s SupplierQuoteRequestService) findQuoteRequest(ctx context.Context, quoteRequestID uint64) (*SupplierQuoteRequest, error) {
	quoteRequest, err := s.quoteRequests.Find(ctx, quoteRequestID)
	if err != nil {
		return nil, dao.NotFound(err, ErrQuoteRequestNotFound)
	}
	if quoteRequest == nil {
		return nil, ErrQuoteRequestNotFound
	}
	return quoteRequest, nil
}

func (s SupplierQuoteRequestService) findQuote(ctx context.Context, quoteID uint64) (*SupplierQuote, error) {
	quote, err := s.quotes.Find(ctx, quoteID)
	if err != nil {
		return nil, dao.NotFound(err, ErrSupplierQuoteNotFound)
	}
	if quote == nil {
		return nil, ErrSupplierQuoteNotFound
	}
	return quote, nil
}

func (s SupplierQuoteRequestService) ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[SupplierQuoteRequest], error) {
	return s.quoteRequests.List(ctx, scope.ToOrg(q, organizationID))
}

func (s SupplierQuoteRequestService) FindInOrg(ctx context.Context, id, organizationID uint64) (*SupplierQuoteRequest, error) {
	e, err := s.quoteRequests.Find(ctx, id)
	if err != nil || e == nil || !scope.Owns(e.OrganizationID, organizationID) {
		return nil, err
	}
	return e, nil
}
