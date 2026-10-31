package manufacturing

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/inventory"
	"github.com/jalusw/swantara/apps/service/internal/kernel/amount"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/kernel/scope"
	"github.com/jalusw/swantara/apps/service/internal/kernel/sequence"
	"github.com/jalusw/swantara/apps/service/internal/products"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type ProductionOrderService struct {
	orders       ProductionOrderDAO
	components   ConsumedMaterialDAO
	recipes      RecipeDAO
	recipeSvc    RecipeService
	variants     products.ItemVariantDAO
	locations    inventory.StockLocationDAO
	reservations inventory.HoldService
	sequences    sequence.Service
}

func NewProductionOrderService(
	orders ProductionOrderDAO,
	components ConsumedMaterialDAO,
	recipes RecipeDAO,
	recipeSvc RecipeService,
	variants products.ItemVariantDAO,
	locations inventory.StockLocationDAO,
	reservations inventory.HoldService,
	sequences sequence.Service,
) ProductionOrderService {
	return ProductionOrderService{
		orders:       orders,
		components:   components,
		recipes:      recipes,
		recipeSvc:    recipeSvc,
		variants:     variants,
		locations:    locations,
		reservations: reservations,
		sequences:    sequences,
	}
}

func (s ProductionOrderService) Create(ctx context.Context, productionOrder *ProductionOrder) (*ProductionOrder, error) {
	if productionOrder.OrganizationID == nil {
		return nil, ErrProductionOrderOrganization
	}
	if !amount.FromFloat64(productionOrder.QtyToProduce).GreaterThan(amount.Zero()) {
		return nil, ErrProductionOrderQty
	}
	if productionOrder.RecipeID == nil {
		return nil, ErrProductionOrderRecipe
	}
	if productionOrder.SrcLocationID == nil || productionOrder.DstLocationID == nil {
		return nil, ErrProductionOrderLocation
	}

	variant, err := s.variants.FindInOrg(ctx, productionOrder.ItemID, *productionOrder.OrganizationID)
	if err != nil {
		return nil, dao.NotFound(err, ErrProductionOrderItem)
	}
	if variant == nil {
		return nil, ErrProductionOrderItem
	}

	recipe, err := s.recipes.Find(ctx, *productionOrder.RecipeID)
	if err != nil {
		return nil, dao.NotFound(err, ErrProductionOrderRecipe)
	}
	if recipe == nil {
		return nil, ErrProductionOrderRecipe
	}
	if recipe.ItemID != productionOrder.ItemID || !scope.Owns(recipe.OrganizationID, *productionOrder.OrganizationID) {
		return nil, ErrProductionOrderRecipe
	}

	if err := s.validateLocations(ctx, *productionOrder.OrganizationID, productionOrder.SrcLocationID, productionOrder.DstLocationID); err != nil {
		return nil, err
	}

	requirements, err := s.recipeSvc.Explode(ctx, *productionOrder.RecipeID, amount.FromFloat64(productionOrder.QtyToProduce))
	if err != nil {
		return nil, err
	}
	if len(requirements) == 0 {
		return nil, ErrConsumedMaterial
	}

	components := make([]*ConsumedMaterial, len(requirements))
	for i, requirement := range requirements {
		components[i] = &ConsumedMaterial{
			ItemID:          requirement.ComponentID,
			QtyPlanned:      requirement.Qty.Float64(),
			UnitID:          requirement.UnitID,
			StockMovementID: nil,
		}
	}

	name, err := s.sequences.Next(ctx, *productionOrder.OrganizationID, SequenceProductionOrderCode)
	if err != nil {
		if errors.Is(err, sequence.ErrSequenceNotFound) {
			return nil, ErrProductionOrderSequence
		}
		return nil, err
	}
	productionOrder.Name = helper.Ptr(name)
	productionOrder.State = ProductionOrderStateDraft

	return s.orders.CreateWithComponents(ctx, productionOrder, components)
}

func (s ProductionOrderService) Confirm(ctx context.Context, productionOrderID uint64) (*ProductionOrder, error) {
	productionOrder, err := s.orders.Find(ctx, productionOrderID)
	if err != nil {
		return nil, dao.NotFound(err, ErrProductionOrderNotFound)
	}
	if productionOrder == nil {
		return nil, ErrProductionOrderNotFound
	}
	if productionOrder.State != ProductionOrderStateDraft {
		return nil, ErrProductionOrderState
	}
	productionOrder.State = ProductionOrderStateConfirmed
	return s.orders.Update(ctx, productionOrder)
}

func (s ProductionOrderService) Plan(ctx context.Context, productionOrderID uint64) (*ProductionOrder, error) {
	productionOrder, err := s.orders.Find(ctx, productionOrderID)
	if err != nil {
		return nil, dao.NotFound(err, ErrProductionOrderNotFound)
	}
	if productionOrder == nil {
		return nil, ErrProductionOrderNotFound
	}
	if productionOrder.State != ProductionOrderStateConfirmed {
		return nil, ErrProductionOrderState
	}
	if productionOrder.SrcLocationID == nil {
		return nil, ErrProductionOrderLocation
	}

	components, err := s.components.ListByProductionOrder(ctx, productionOrderID)
	if err != nil {
		return nil, err
	}
	if len(components) == 0 {
		return nil, ErrConsumedMaterial
	}

	reserved := make([]*inventory.StockHold, 0, len(components))
	for _, component := range components {
		reservation, err := s.reservations.ReserveForProductionOrder(ctx, *productionOrder.OrganizationID, productionOrderID, component.ItemID, *productionOrder.SrcLocationID, nil, amount.FromFloat64(component.QtyPlanned))
		if err != nil {
			for _, hold := range reserved {
				if relErr := s.reservations.Release(ctx, hold.ID); relErr != nil {
					slog.Error("failed to release production order hold", "hold_id", hold.ID, "error", relErr)
				}
			}
			if errors.Is(err, inventory.ErrBalanceNotFound) || errors.Is(err, inventory.ErrHoldOverflow) {
				return nil, err
			}
			return nil, fmt.Errorf("%w: %v", ErrProductionOrderReservation, err)
		}
		reserved = append(reserved, reservation)
	}

	productionOrder.State = ProductionOrderStatePlanned
	updated, err := s.orders.Update(ctx, productionOrder)
	if err != nil {
		if relErr := s.reservations.ReleaseByProductionOrder(ctx, productionOrderID); relErr != nil {
			slog.Error("failed to release production order holds after update failure", "production_order_id", productionOrderID, "error", relErr)
		}
		return nil, err
	}
	return updated, nil
}

func (s ProductionOrderService) Cancel(ctx context.Context, productionOrderID uint64) (*ProductionOrder, error) {
	productionOrder, err := s.orders.Find(ctx, productionOrderID)
	if err != nil {
		return nil, dao.NotFound(err, ErrProductionOrderNotFound)
	}
	if productionOrder == nil {
		return nil, ErrProductionOrderNotFound
	}
	if productionOrder.State == ProductionOrderStateDone || productionOrder.State == ProductionOrderStateCancelled {
		return nil, ErrProductionOrderState
	}
	productionOrder.State = ProductionOrderStateCancelled
	updated, err := s.orders.Update(ctx, productionOrder)
	if err != nil {
		return nil, err
	}
	if err := s.reservations.ReleaseByProductionOrder(ctx, productionOrderID); err != nil {
		slog.Error("failed to release production order holds on cancel", "production_order_id", productionOrderID, "error", err)
	}
	return updated, nil
}

func (s ProductionOrderService) validateLocations(ctx context.Context, organizationID uint64, src, dst *uint64) error {
	for _, locationID := range []uint64{*src, *dst} {
		location, err := s.locations.Find(ctx, locationID)
		if err != nil {
			return dao.NotFound(err, ErrProductionOrderLocation)
		}
		if location == nil || !helper.OwnedByOrg(location.OrganizationID, &organizationID) {
			return ErrProductionOrderLocation
		}
	}
	return nil
}

func (s ProductionOrderService) List(ctx context.Context, q *query.Query) (*query.Page[ProductionOrder], error) {
	return s.orders.List(ctx, q)
}

func (s ProductionOrderService) Find(ctx context.Context, id uint64) (*ProductionOrder, error) {
	return s.orders.Find(ctx, id)
}

func (s ProductionOrderService) ListComponents(ctx context.Context, productionOrderID uint64) ([]*ConsumedMaterial, error) {
	return s.components.ListByProductionOrder(ctx, productionOrderID)
}

func (s ProductionOrderService) ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[ProductionOrder], error) {
	return s.orders.List(ctx, scope.ToOrg(q, organizationID))
}

func (s ProductionOrderService) FindInOrg(ctx context.Context, id, organizationID uint64) (*ProductionOrder, error) {
	e, err := s.orders.Find(ctx, id)
	if err != nil || e == nil || !scope.Owns(e.OrganizationID, organizationID) {
		return nil, err
	}
	return e, nil
}
