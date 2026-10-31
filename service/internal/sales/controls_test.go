package sales

import (
	"context"
	"testing"

	"github.com/jalusw/swantara/apps/service/internal/accounting"
	"github.com/jalusw/swantara/apps/service/internal/contacts"
	"github.com/jalusw/swantara/apps/service/internal/crosscutting"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/kernel/amount"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type salesConfigSourceStub struct {
	policy SalesApprovalPolicy
	err    error
}

func (s salesConfigSourceStub) ApprovalPolicy(context.Context, uint64) (SalesApprovalPolicy, error) {
	return s.policy, s.err
}

type approvalEngineStub struct {
	request     *crosscutting.ApprovalRequest
	created     []uint64
	byUserID    uint64
	invalidated [][2]any
}

func (s *approvalEngineStub) IsApproved(context.Context, string, uint64) (bool, error) {
	return s.request != nil && s.request.State == crosscutting.ApprovalStateApproved, nil
}

func (s *approvalEngineStub) Create(_ context.Context, _ uint64, _ string, _, requestedBy uint64, approverIDs []uint64) (*crosscutting.ApprovalRequest, error) {
	s.byUserID = requestedBy
	s.created = append(s.created, approverIDs...)
	return &crosscutting.ApprovalRequest{State: crosscutting.ApprovalStatePending}, nil
}

func (s *approvalEngineStub) State(context.Context, string, uint64) (*crosscutting.ApprovalRequest, []*crosscutting.ApprovalStep, error) {
	return s.request, nil, nil
}

func (s *approvalEngineStub) Invalidate(_ context.Context, ownerType string, ownerID uint64) error {
	s.invalidated = append(s.invalidated, [2]any{ownerType, ownerID})
	return nil
}

func creditControls(limit float64, open []*accounting.Invoice) SalesControls {
	organizationID := uint64(1)
	return SalesControls{
		Customers: contacts.CustomerProfileDAOMock{
			FindByContactFunc: func(context.Context, uint64) (*contacts.CustomerProfile, error) {
				return &contacts.CustomerProfile{CreditLimit: helper.Ptr(limit)}, nil
			},
		},
		Invoices: InvoiceLookupMock{
			ListOpenByContactFunc: func(context.Context, uint64) ([]*accounting.Invoice, error) {
				for i := range open {
					open[i].OrganizationID = &organizationID
				}
				return open, nil
			},
		},
	}
}

func TestSalesControlsEnforce(t *testing.T) {
	ctx := model.ContextWithActor(context.Background(), 42)
	organizationID := uint64(1)
	orderID := uint64(10)

	t.Run("inert when not configured", func(t *testing.T) {
		if err := (SalesControls{}).Enforce(ctx, organizationID, ApprovalOwnerTypeSaleOrder, orderID, 5, 500, nil, 0); err != nil {
			t.Fatalf("Enforce() error = %v, want nil", err)
		}
	})

	t.Run("holds sales that exceed the credit limit", func(t *testing.T) {
		controls := creditControls(1000, []*accounting.Invoice{{AmountResidual: amount.FromFloat64(800)}})
		err := controls.Enforce(ctx, organizationID, ApprovalOwnerTypeSaleOrder, orderID, 5, 500, nil, 0)
		helper.AssertError(t, err, true, ErrSalesCreditLimit)
	})

	t.Run("allows sales within the credit limit", func(t *testing.T) {
		controls := creditControls(1000, []*accounting.Invoice{{AmountResidual: amount.FromFloat64(300)}})
		if err := controls.Enforce(ctx, organizationID, ApprovalOwnerTypeSaleOrder, orderID, 5, 500, nil, 0); err != nil {
			t.Fatalf("Enforce() error = %v, want nil", err)
		}
	})

	t.Run("creates an approval request for an over-limit sale", func(t *testing.T) {
		controls := creditControls(1000, nil)
		engine := &approvalEngineStub{}
		controls.Approvals = engine
		controls.Configs = salesConfigSourceStub{policy: SalesApprovalPolicy{ApproverIDs: []uint64{7, 8}}}

		err := controls.Enforce(ctx, organizationID, ApprovalOwnerTypeSaleOrder, orderID, 5, 1500, nil, 0)
		helper.AssertError(t, err, true, ErrSalesApprovalPending)
		if len(engine.created) != 2 || engine.created[0] != 7 || engine.created[1] != 8 {
			t.Fatalf("created approvers = %v, want [7 8]", engine.created)
		}
		if engine.byUserID != 42 {
			t.Fatalf("requested_by = %d, want 42", engine.byUserID)
		}
	})

	t.Run("reports a pending request", func(t *testing.T) {
		controls := creditControls(1000, nil)
		controls.Approvals = &approvalEngineStub{request: &crosscutting.ApprovalRequest{State: crosscutting.ApprovalStatePending}}
		controls.Configs = salesConfigSourceStub{policy: SalesApprovalPolicy{ApproverIDs: []uint64{7}}}

		err := controls.Enforce(ctx, organizationID, ApprovalOwnerTypeSaleOrder, orderID, 5, 1500, nil, 0)
		helper.AssertError(t, err, true, ErrSalesApprovalPending)
	})

	t.Run("allows an approved over-limit sale", func(t *testing.T) {
		controls := creditControls(1000, nil)
		controls.Approvals = &approvalEngineStub{request: &crosscutting.ApprovalRequest{State: crosscutting.ApprovalStateApproved}}
		controls.Configs = salesConfigSourceStub{policy: SalesApprovalPolicy{ApproverIDs: []uint64{7}}}

		if err := controls.Enforce(ctx, organizationID, ApprovalOwnerTypeSaleOrder, orderID, 5, 1500, nil, 0); err != nil {
			t.Fatalf("Enforce() error = %v, want nil", err)
		}
	})

	t.Run("reports a refused request", func(t *testing.T) {
		controls := creditControls(1000, nil)
		controls.Approvals = &approvalEngineStub{request: &crosscutting.ApprovalRequest{State: crosscutting.ApprovalStateRefused}}
		controls.Configs = salesConfigSourceStub{policy: SalesApprovalPolicy{ApproverIDs: []uint64{7}}}

		err := controls.Enforce(ctx, organizationID, ApprovalOwnerTypeSaleOrder, orderID, 5, 1500, nil, 0)
		helper.AssertError(t, err, true, ErrSalesApprovalRefused)
	})

	t.Run("requires approval for a deep discount", func(t *testing.T) {
		controls := SalesControls{
			Approvals: &approvalEngineStub{},
			Configs:   salesConfigSourceStub{policy: SalesApprovalPolicy{DiscountThreshold: 10, ApproverIDs: []uint64{7}}},
		}
		err := controls.Enforce(ctx, organizationID, ApprovalOwnerTypeSaleQuote, orderID, 5, 500, nil, 15)
		helper.AssertError(t, err, true, ErrSalesApprovalPending)
	})

	t.Run("requires approval for a non-standard payment term", func(t *testing.T) {
		controls := SalesControls{
			Approvals: &approvalEngineStub{},
			Configs:   salesConfigSourceStub{policy: SalesApprovalPolicy{StandardPaymentTermIDs: []uint64{1, 2}, ApproverIDs: []uint64{7}}},
		}
		termID := uint64(3)
		err := controls.Enforce(ctx, organizationID, ApprovalOwnerTypeSaleQuote, orderID, 5, 500, &termID, 0)
		helper.AssertError(t, err, true, ErrSalesApprovalPending)
	})

	t.Run("allows a standard payment term", func(t *testing.T) {
		controls := SalesControls{
			Approvals: &approvalEngineStub{},
			Configs:   salesConfigSourceStub{policy: SalesApprovalPolicy{StandardPaymentTermIDs: []uint64{1, 2}, ApproverIDs: []uint64{7}}},
		}
		termID := uint64(2)
		if err := controls.Enforce(ctx, organizationID, ApprovalOwnerTypeSaleQuote, orderID, 5, 500, &termID, 0); err != nil {
			t.Fatalf("Enforce() error = %v, want nil", err)
		}
	})

	t.Run("holds when no approvers are configured", func(t *testing.T) {
		controls := SalesControls{
			Approvals: &approvalEngineStub{},
			Configs:   salesConfigSourceStub{policy: SalesApprovalPolicy{DiscountThreshold: 10}},
		}
		err := controls.Enforce(ctx, organizationID, ApprovalOwnerTypeSaleQuote, orderID, 5, 500, nil, 15)
		helper.AssertError(t, err, true, ErrSalesApprovalRequired)
	})
}

func TestSaleOrderServiceConfirmAppliesCreditHold(t *testing.T) {
	organizationID := uint64(1)
	orders := SaleOrderDAOMock{CRUDMock: dao.CRUDMock[SaleOrder]{
		FindFunc: func(context.Context, uint64) (*SaleOrder, error) {
			return &SaleOrder{
				Base:           model.Base{ID: 1},
				OrganizationID: &organizationID,
				ContactID:      5,
				State:          OrderStateSent,
				WarehouseID:    helper.Ptr(uint64(4)),
				AmountTotal:    1500,
			}, nil
		},
	}}
	lines := SaleOrderLineDAOMock{
		ListByOrderFunc: func(context.Context, uint64) ([]*SaleOrderLine, error) {
			return []*SaleOrderLine{{Base: model.Base{ID: 7}, ItemID: helper.Ptr(uint64(100)), QtyOrdered: 1}}, nil
		},
	}
	svc := testSaleOrderService(orders, lines, dao.CRUDMock[reference.Tax]{}, testPriceService(100)).
		WithControls(creditControls(1000, nil))

	_, err := svc.Confirm(context.Background(), 1)
	helper.AssertError(t, err, true, ErrSalesCreditLimit)
}

func TestSaleQuoteServiceAcceptAppliesCreditHold(t *testing.T) {
	organizationID := uint64(1)
	quotes := SaleQuoteDAOMock{CRUDMock: dao.CRUDMock[SaleQuote]{
		FindFunc: func(context.Context, uint64) (*SaleQuote, error) {
			return &SaleQuote{
				Base:           model.Base{ID: 1},
				OrganizationID: &organizationID,
				ContactID:      5,
				State:          QuoteStateSent,
				IsCurrent:      true,
				AmountTotal:    1500,
			}, nil
		},
	}}
	lines := SaleQuoteLineDAOMock{
		ListByQuoteFunc: func(context.Context, uint64) ([]*SaleQuoteLine, error) {
			return []*SaleQuoteLine{{Base: model.Base{ID: 7}, ItemID: helper.Ptr(uint64(100)), Qty: 1}}, nil
		},
	}
	svc := testSaleQuoteService(quotes, lines).WithControls(creditControls(1000, nil))

	_, err := svc.Accept(context.Background(), 1)
	helper.AssertError(t, err, true, ErrSalesCreditLimit)
}
