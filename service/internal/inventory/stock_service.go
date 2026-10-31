package inventory

import (
	"context"

	"github.com/jalusw/swantara/apps/service/internal/kernel/clock"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type StockService struct {
	movements StockMovementDAO
	shipments ShipmentDAO
	balances  StockBalanceDAO
}

func NewStockService(movements StockMovementDAO, shipments ShipmentDAO, balances StockBalanceDAO) StockService {
	return StockService{movements: movements, shipments: shipments, balances: balances}
}

func (s StockService) ListMovements(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[StockMovement], error) {
	return s.movements.ListInOrg(ctx, q, organizationID)
}

func (s StockService) FindMovement(ctx context.Context, id, organizationID uint64) (*StockMovement, error) {
	return s.movements.FindInOrg(ctx, id, organizationID)
}

func (s StockService) DeleteMovement(ctx context.Context, id, organizationID uint64) error {
	movement, err := s.movements.FindInOrg(ctx, id, organizationID)
	if err != nil {
		return dao.NotFound(err, ErrMovementNotFound)
	}
	if movement == nil {
		return ErrMovementNotFound
	}
	if movement.State != MovementStateDraft {
		return ErrMovementState
	}
	return s.movements.Delete(ctx, id)
}

func (s StockService) ConfirmMovement(ctx context.Context, id, organizationID uint64) (*StockMovement, error) {
	movement, err := s.movements.FindInOrg(ctx, id, organizationID)
	if err != nil {
		return nil, dao.NotFound(err, ErrMovementNotFound)
	}
	if movement == nil {
		return nil, ErrMovementNotFound
	}
	if movement.State != MovementStateDraft {
		return nil, ErrMovementState
	}
	movement.State = MovementStateConfirmed
	return s.movements.Update(ctx, movement)
}

func (s StockService) ListShipments(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[Shipment], error) {
	return s.shipments.ListInOrg(ctx, q, organizationID)
}

func (s StockService) FindShipment(ctx context.Context, id, organizationID uint64) (*Shipment, error) {
	return s.shipments.FindInOrg(ctx, id, organizationID)
}

func (s StockService) findShipment(ctx context.Context, id, organizationID uint64) (*Shipment, error) {
	shipment, err := s.shipments.FindInOrg(ctx, id, organizationID)
	if err != nil {
		return nil, dao.NotFound(err, ErrShipmentNotFound)
	}
	if shipment == nil {
		return nil, ErrShipmentNotFound
	}
	return shipment, nil
}

func (s StockService) ConfirmShipment(ctx context.Context, id, organizationID uint64) (*Shipment, error) {
	shipment, err := s.findShipment(ctx, id, organizationID)
	if err != nil {
		return nil, err
	}
	if shipment.State != ShipmentStateDraft && shipment.State != ShipmentStateWaiting {
		return nil, ErrShipmentState
	}
	shipment.State = ShipmentStateConfirmed
	return s.shipments.Update(ctx, shipment)
}

func (s StockService) CompleteShipment(ctx context.Context, id, organizationID uint64) (*Shipment, error) {
	shipment, err := s.findShipment(ctx, id, organizationID)
	if err != nil {
		return nil, err
	}
	if shipment.State != ShipmentStateConfirmed && shipment.State != ShipmentStateAssigned {
		return nil, ErrShipmentState
	}
	now := clock.Now().UTC()
	shipment.State = ShipmentStateDone
	shipment.DateDone = &now
	return s.shipments.Update(ctx, shipment)
}

func (s StockService) CancelShipment(ctx context.Context, id, organizationID uint64) (*Shipment, error) {
	shipment, err := s.findShipment(ctx, id, organizationID)
	if err != nil {
		return nil, err
	}
	if shipment.State == ShipmentStateDone || shipment.State == ShipmentStateCancelled {
		return nil, ErrShipmentState
	}
	shipment.State = ShipmentStateCancelled
	return s.shipments.Update(ctx, shipment)
}

func (s StockService) ListBalances(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[StockBalance], error) {
	return s.balances.ListInOrg(ctx, q, organizationID)
}
