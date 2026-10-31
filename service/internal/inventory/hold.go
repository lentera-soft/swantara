package inventory

import (
	"context"
	"errors"

	"github.com/jalusw/swantara/apps/service/internal/kernel/amount"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"gorm.io/gorm"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type HoldService struct {
	reservations StockHoldDAO
	quants       StockBalanceDAO
}

func NewHoldService(reservations StockHoldDAO, quants StockBalanceDAO) HoldService {
	return HoldService{reservations: reservations, quants: quants}
}

func (s HoldService) ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[StockHold], error) {
	return s.reservations.ListInOrg(ctx, q, organizationID)
}

func (s HoldService) FindInOrg(ctx context.Context, id, organizationID uint64) (*StockHold, error) {
	return s.reservations.FindInOrg(ctx, id, organizationID)
}

func (s HoldService) ReleaseByMovementInOrg(ctx context.Context, organizationID, movementID uint64) error {
	return s.reservations.ReleaseByMovementInOrg(ctx, organizationID, movementID)
}

func (s HoldService) Reserve(ctx context.Context, organizationID, itemID, locationID uint64, batchID *uint64, qty amount.Amount, movementID *uint64) (*StockHold, error) {
	if !qty.GreaterThan(amount.Zero()) {
		return nil, ErrMovementQty
	}

	quant, err := s.quants.FindByKey(ctx, itemID, locationID, batchID)
	if err != nil {
		return nil, dao.NotFound(err, ErrBalanceNotFound)
	}
	if quant == nil {
		return nil, ErrBalanceNotFound
	}
	if quant.OrganizationID == nil || *quant.OrganizationID != organizationID {
		return nil, ErrBalanceNotFound
	}

	available := amount.FromFloat64(quant.Quantity).Sub(amount.FromFloat64(quant.ReservedQty))
	if qty.GreaterThan(available) {
		return nil, ErrHoldOverflow
	}

	reservation, err := s.reservations.Reserve(ctx, quant.ID, movementID, qty.Float64())
	if err != nil {
		if errors.Is(err, ErrHoldConflict) {
			return nil, ErrHoldOverflow
		}
		return nil, err
	}
	return reservation, nil
}

func (s HoldService) ReserveForProductionOrder(ctx context.Context, organizationID, productionOrderID, itemID, locationID uint64, batchID *uint64, qty amount.Amount) (*StockHold, error) {
	reservation, err := s.Reserve(ctx, organizationID, itemID, locationID, batchID, qty, nil)
	if err != nil {
		return nil, err
	}
	reservation.ProductionOrderID = &productionOrderID
	updated, err := s.reservations.Update(ctx, reservation)
	if err != nil {
		if releaseErr := s.Release(ctx, reservation.ID); releaseErr != nil {
			return nil, releaseErr
		}
		return nil, err
	}
	return updated, nil
}

func (s HoldService) Release(ctx context.Context, reservationID uint64) error {
	if err := s.reservations.Release(ctx, reservationID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrHoldNotFound
		}
		return err
	}
	return nil
}

func (s HoldService) ReleaseByProductionOrder(ctx context.Context, productionOrderID uint64) error {
	return s.reservations.ReleaseByProductionOrder(ctx, productionOrderID)
}

func (s HoldService) ReleaseByProductionOrderItem(ctx context.Context, productionOrderID, itemID, locationID uint64, qty amount.Amount) error {
	if !qty.GreaterThan(amount.Zero()) {
		return nil
	}
	return s.reservations.ReleaseByProductionOrderItem(ctx, productionOrderID, itemID, locationID, qty.Float64())
}
