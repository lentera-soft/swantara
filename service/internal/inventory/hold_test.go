package inventory

import (
	"context"
	"testing"

	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/kernel/amount"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
)

func TestHoldService_Reserve_DecrementsAvailable(t *testing.T) {
	ctx := context.Background()
	quant := &StockBalance{Base: model.Base{ID: 3}, OrganizationID: helper.Ptr(uint64(1)), ItemID: 100, LocationID: 10, Quantity: 10, ReservedQty: 2}
	quants := StockBalanceDAOMock{
		FindByKeyFunc: func(_ context.Context, _, _ uint64, _ *uint64) (*StockBalance, error) {
			return quant, nil
		},
	}
	svc := NewHoldService(StockHoldDAOMock{}, quants)

	reservation, err := svc.Reserve(ctx, 1, 100, 10, nil, amount.FromFloat64(5), nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if reservation.Qty != 5 || reservation.BalanceID != 3 {
		t.Errorf("reservation = %+v, want qty 5 on quant 3", reservation)
	}
}

func TestHoldService_Reserve_RejectsOverflow(t *testing.T) {
	ctx := context.Background()
	quants := StockBalanceDAOMock{
		FindByKeyFunc: func(_ context.Context, _, _ uint64, _ *uint64) (*StockBalance, error) {
			return &StockBalance{Base: model.Base{ID: 3}, OrganizationID: helper.Ptr(uint64(1)), Quantity: 10, ReservedQty: 8}, nil
		},
	}
	svc := NewHoldService(StockHoldDAOMock{}, quants)

	_, err := svc.Reserve(ctx, 1, 100, 10, nil, amount.FromFloat64(5), nil)
	if helper.AssertError(t, err, true, ErrHoldOverflow) {
		return
	}
}

func TestHoldService_Reserve_RejectsMissingQuant(t *testing.T) {
	ctx := context.Background()
	svc := NewHoldService(StockHoldDAOMock{}, StockBalanceDAOMock{})

	_, err := svc.Reserve(ctx, 1, 100, 10, nil, amount.FromFloat64(5), nil)
	if helper.AssertError(t, err, true, ErrBalanceNotFound) {
		return
	}
}

func TestHoldService_Reserve_RejectsQuantFromOtherOrganization(t *testing.T) {
	ctx := context.Background()
	quants := StockBalanceDAOMock{
		FindByKeyFunc: func(_ context.Context, _, _ uint64, _ *uint64) (*StockBalance, error) {
			return &StockBalance{Base: model.Base{ID: 3}, OrganizationID: helper.Ptr(uint64(2)), Quantity: 10}, nil
		},
	}
	svc := NewHoldService(StockHoldDAOMock{}, quants)

	_, err := svc.Reserve(ctx, 1, 100, 10, nil, amount.FromFloat64(5), nil)
	if helper.AssertError(t, err, true, ErrBalanceNotFound) {
		return
	}
}

func TestHoldService_Reserve_RejectsNonPositiveQty(t *testing.T) {
	ctx := context.Background()
	svc := NewHoldService(StockHoldDAOMock{}, StockBalanceDAOMock{})

	_, err := svc.Reserve(ctx, 1, 100, 10, nil, amount.Zero(), nil)
	if helper.AssertError(t, err, true, ErrMovementQty) {
		return
	}
}

func TestHoldService_Reserve_PropagatesFindByKeyError(t *testing.T) {
	ctx := context.Background()
	quants := StockBalanceDAOMock{
		FindByKeyFunc: func(_ context.Context, _, _ uint64, _ *uint64) (*StockBalance, error) {
			return nil, ErrBalanceNotFound
		},
	}
	svc := NewHoldService(StockHoldDAOMock{}, quants)

	_, err := svc.Reserve(ctx, 1, 100, 10, nil, amount.FromFloat64(5), nil)
	if helper.AssertError(t, err, true, ErrBalanceNotFound) {
		return
	}
}

func TestHoldService_ReserveForProductionOrder_LinksReservation(t *testing.T) {
	ctx := context.Background()
	quant := &StockBalance{Base: model.Base{ID: 3}, OrganizationID: helper.Ptr(uint64(1)), ItemID: 100, LocationID: 10, Quantity: 10}
	quants := StockBalanceDAOMock{
		FindByKeyFunc: func(_ context.Context, _, _ uint64, _ *uint64) (*StockBalance, error) {
			return quant, nil
		},
	}
	var linked *uint64
	reservations := StockHoldDAOMock{
		CRUDMock: dao.CRUDMock[StockHold]{
			UpdateFunc: func(_ context.Context, hold *StockHold) (*StockHold, error) {
				linked = hold.ProductionOrderID
				return hold, nil
			},
		},
	}
	svc := NewHoldService(reservations, quants)

	reservation, err := svc.ReserveForProductionOrder(ctx, 1, 77, 100, 10, nil, amount.FromFloat64(5))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if linked == nil || *linked != 77 {
		t.Fatalf("linked production order = %v, want 77", linked)
	}
	if reservation.ProductionOrderID == nil || *reservation.ProductionOrderID != 77 {
		t.Errorf("reservation production order = %v, want 77", reservation.ProductionOrderID)
	}
}

func TestHoldService_ReleaseByProductionOrderItem_DelegatesQty(t *testing.T) {
	ctx := context.Background()
	var gotProductionOrderID, gotItemID, gotLocationID uint64
	var gotQty float64
	reservations := StockHoldDAOMock{
		ReleaseByProductionOrderItemFunc: func(_ context.Context, productionOrderID, itemID, locationID uint64, qty float64) error {
			gotProductionOrderID, gotItemID, gotLocationID, gotQty = productionOrderID, itemID, locationID, qty
			return nil
		},
	}
	svc := NewHoldService(reservations, StockBalanceDAOMock{})

	if err := svc.ReleaseByProductionOrderItem(ctx, 77, 100, 10, amount.FromFloat64(4)); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if gotProductionOrderID != 77 || gotItemID != 100 || gotLocationID != 10 || gotQty != 4 {
		t.Errorf("released = %d/%d/%d/%v, want 77/100/10/4", gotProductionOrderID, gotItemID, gotLocationID, gotQty)
	}
}
