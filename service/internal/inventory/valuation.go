package inventory

import (
	"context"
	"fmt"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/accounting"
	"github.com/jalusw/swantara/apps/service/internal/db"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/kernel/amount"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"gorm.io/gorm"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type BatchService struct {
	lots     BatchDAO
	resolver ItemResolver
}

func NewBatchService(lots BatchDAO, resolver ItemResolver) BatchService {
	return BatchService{lots: lots, resolver: resolver}
}

func (s BatchService) ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[Batch], error) {
	return s.lots.ListInOrg(ctx, q, organizationID)
}

func (s BatchService) FindInOrg(ctx context.Context, id, organizationID uint64) (*Batch, error) {
	return s.lots.FindInOrg(ctx, id, organizationID)
}

func (s BatchService) Create(ctx context.Context, organizationID uint64, batch *Batch) (*Batch, error) {
	if err := s.validateLot(ctx, organizationID, batch, 0); err != nil {
		return nil, err
	}
	return s.lots.Create(ctx, batch)
}

func (s BatchService) Update(ctx context.Context, organizationID uint64, batch *Batch) (*Batch, error) {
	if err := s.validateLot(ctx, organizationID, batch, batch.ID); err != nil {
		return nil, err
	}
	return s.lots.Update(ctx, batch)
}

func (s BatchService) validateLot(ctx context.Context, organizationID uint64, batch *Batch, excludeID uint64) error {
	if batch.Name == "" {
		return ErrBatchNameTaken
	}
	resolved, err := s.resolver.Resolve(ctx, batch.ItemID)
	if err != nil {
		return err
	}
	if resolved.Tracking == "none" {
		return ErrBatchTrackingDisabled
	}
	if resolved.OrganizationID == nil || *resolved.OrganizationID != organizationID {
		return ErrItemNotFound
	}

	existingLots, err := s.lots.ListByItem(ctx, batch.ItemID)
	if err != nil {
		return err
	}
	for _, existing := range existingLots {
		if existing.ID != excludeID && existing.Name == batch.Name {
			return ErrBatchNameTaken
		}
	}
	return nil
}

type ValuationService struct {
	movements StockMovementDAO
	layers    CostLayerDAO
	locations StockLocationDAO
	resolver  ItemResolver
	poster    Poster
	tx        db.Transactioner
}

func NewValuationService(
	movements StockMovementDAO,
	layers CostLayerDAO,
	locations StockLocationDAO,
	resolver ItemResolver,
	poster Poster,
	tx db.Transactioner,
) ValuationService {
	return ValuationService{
		movements: movements,
		layers:    layers,
		locations: locations,
		resolver:  resolver,
		poster:    poster,
		tx:        tx,
	}
}

func EnsureMovementApplicable(movement *StockMovement) error {
	if movement == nil {
		return ErrMovementNotFound
	}
	if movement.State == MovementStateDone || movement.State == MovementStateCancelled {
		return ErrMovementState
	}
	return nil
}

func FindApplicableMovementsTx(ctx context.Context, tx *gorm.DB, movements MovementLocker, movementIDs []uint64) ([]*StockMovement, error) {
	locked := make([]*StockMovement, 0, len(movementIDs))
	for _, movementID := range movementIDs {
		movement, err := movements.FindForUpdateTx(ctx, tx, movementID)
		if err != nil {
			return nil, err
		}
		if err := EnsureMovementApplicable(movement); err != nil {
			return nil, err
		}
		locked = append(locked, movement)
	}
	return locked, nil
}

func (s ValuationService) applyMoveTx(ctx context.Context, tx *gorm.DB, movementID uint64, date time.Time) (*StockMovement, error) {
	locked, err := FindApplicableMovementsTx(ctx, tx, s.movements, []uint64{movementID})
	if err != nil {
		return nil, err
	}
	locked[0].State = MovementStateDone
	locked[0].DateDone = &date
	return s.movements.ApplyTx(ctx, tx, locked[0])
}

func (s ValuationService) loadMovement(ctx context.Context, tx *gorm.DB, movementID uint64) (*StockMovement, error) {
	var (
		movement *StockMovement
		err      error
	)
	if tx == nil {
		movement, err = s.movements.Find(ctx, movementID)
	} else {
		movement, err = s.movements.FindForUpdateTx(ctx, tx, movementID)
	}
	if err != nil {
		return nil, err
	}
	if err := EnsureMovementApplicable(movement); err != nil {
		return nil, err
	}
	return movement, nil
}

func (s ValuationService) requireLocationUsage(ctx context.Context, locationID uint64, invalid error, usages ...string) error {
	location, err := s.locations.Find(ctx, locationID)
	if err != nil {
		return dao.NotFound(err, ErrLocationNotFound)
	}
	if location == nil {
		return ErrLocationNotFound
	}
	for _, usage := range usages {
		if location.Usage == usage {
			return nil
		}
	}
	return invalid
}

func (s ValuationService) prepareMovement(ctx context.Context, tx *gorm.DB, movementID uint64, location func(*StockMovement) uint64, invalid error, usages ...string) (*StockMovement, ResolvedItem, error) {
	movement, err := s.loadMovement(ctx, tx, movementID)
	if err != nil {
		return nil, ResolvedItem{}, err
	}
	if err := s.requireLocationUsage(ctx, location(movement), invalid, usages...); err != nil {
		return nil, ResolvedItem{}, err
	}
	resolved, err := s.resolver.Resolve(ctx, movement.ItemID)
	if err != nil {
		return nil, ResolvedItem{}, err
	}
	if err := s.enforceLot(ctx, resolved, movement); err != nil {
		return nil, ResolvedItem{}, err
	}
	if err := s.requireOrganization(movement); err != nil {
		return nil, ResolvedItem{}, err
	}
	return movement, resolved, nil
}

func (s ValuationService) requireAccount(accountID uint64, err error) error {
	if accountID == 0 {
		return err
	}
	return nil
}

func (s ValuationService) postMovementLayer(
	ctx context.Context,
	tx *gorm.DB,
	movement *StockMovement,
	quantity, unitCost, value amount.Amount,
	remaining bool,
	journalID uint64,
	date time.Time,
	refPrefix, description string,
	lines []accounting.PostingLine,
) (*CostLayer, error) {
	layer := &CostLayer{
		MovementID:  &movement.ID,
		ItemID:      movement.ItemID,
		Quantity:    quantity.Float64(),
		UnitCost:    helper.Ptr(unitCost.Round(4).Float64()),
		Value:       value.Float64(),
		Description: helper.Ptr(description),
	}
	if remaining {
		layer.RemainingQty = quantity.Float64()
		layer.RemainingValue = value.Float64()
	}

	created, err := s.layers.CreateTx(ctx, tx, layer)
	if err != nil {
		return nil, err
	}

	post, err := s.poster.PostTx(ctx, tx, accounting.PostRequest{
		OrganizationID: *movement.OrganizationID,
		JournalID:      journalID,
		Date:           date,
		Ref:            fmt.Sprintf("%s/%d", refPrefix, movement.ID),
		OriginType:     accounting.OriginTypeStockMovement,
		OriginID:       movement.ID,
		Description:    description,
		Lines:          lines,
	})
	if err != nil {
		return nil, err
	}

	created.JournalEntryID = &post.ID
	return s.layers.UpdateTx(ctx, tx, created)
}

func (s ValuationService) Receive(ctx context.Context, movementID uint64, unitCost amount.Amount, journalID uint64, date time.Time) (*CostLayer, error) {
	movement, resolved, err := s.prepareMovement(ctx, nil, movementID, func(m *StockMovement) uint64 { return m.SrcLocationID }, ErrNotReceipt, "supplier")
	if err != nil {
		return nil, err
	}
	return s.receivePrepared(ctx, movementID, movement, resolved, unitCost, journalID, date)
}

func (s ValuationService) receivePrepared(ctx context.Context, movementID uint64, movement *StockMovement, resolved ResolvedItem, unitCost amount.Amount, journalID uint64, date time.Time) (*CostLayer, error) {
	if unitCost.IsNegative() {
		return nil, ErrNegativeCost
	}
	if err := s.requireAccount(resolved.StockValuationAccountID, ErrValuationAccount); err != nil {
		return nil, err
	}
	if err := s.requireAccount(resolved.StockInputAccountID, ErrInputAccount); err != nil {
		return nil, err
	}

	cost, err := s.receiptCost(resolved, unitCost)
	if err != nil {
		return nil, err
	}

	qty := amount.FromFloat64(movement.Qty)
	value := qty.Mul(cost).Round(4)

	var layer *CostLayer
	if err := s.tx.Run(ctx, func(tx *gorm.DB) error {
		if _, err := s.applyMoveTx(ctx, tx, movementID, date); err != nil {
			return err
		}

		var err error
		layer, err = s.postMovementLayer(ctx, tx, movement, qty, cost, value, true, journalID, date, "REC", "Goods receipt", []accounting.PostingLine{
			{AccountID: resolved.StockValuationAccountID, Name: "Inventory", Debit: value},
			{AccountID: resolved.StockInputAccountID, Name: "Stock Input", Credit: value},
		})
		return err
	}); err != nil {
		return nil, err
	}
	return layer, nil
}

func (s ValuationService) Ship(ctx context.Context, movementID uint64, journalID uint64, date time.Time) (*CostLayer, error) {
	var layer *CostLayer
	err := s.tx.Run(ctx, func(tx *gorm.DB) error {
		var err error
		layer, err = s.ShipTx(ctx, tx, movementID, journalID, date)
		return err
	})
	if err != nil {
		return nil, err
	}
	return layer, nil
}

func (s ValuationService) ShipTx(ctx context.Context, tx *gorm.DB, movementID uint64, journalID uint64, date time.Time) (*CostLayer, error) {
	movement, resolved, err := s.prepareMovement(ctx, tx, movementID, func(m *StockMovement) uint64 { return m.DstLocationID }, ErrNotShipment, "customer")
	if err != nil {
		return nil, err
	}
	if err := s.requireAccount(resolved.StockValuationAccountID, ErrValuationAccount); err != nil {
		return nil, err
	}
	if err := s.requireAccount(resolved.CogsAccountID, ErrCogsAccount); err != nil {
		return nil, err
	}

	qty := amount.FromFloat64(movement.Qty)
	cogs, err := s.consumeLayers(ctx, tx, movement.ItemID, resolved.CostMethod, amount.FromFloat64(resolved.StandardCost), qty)
	if err != nil {
		return nil, err
	}

	movement.State = MovementStateDone
	movement.DateDone = &date
	if _, err := s.movements.ApplyTx(ctx, tx, movement); err != nil {
		return nil, err
	}

	cogs = cogs.Round(4)
	unitCost, err := cogs.Div(qty)
	if err != nil {
		return nil, err
	}
	return s.postMovementLayer(ctx, tx, movement, qty.Neg(), unitCost, cogs.Neg(), false, journalID, date, "SHP", "Goods shipment", []accounting.PostingLine{
		{AccountID: resolved.CogsAccountID, Name: "COGS", Debit: cogs},
		{AccountID: resolved.StockValuationAccountID, Name: "Inventory", Credit: cogs},
	})
}

func (s ValuationService) Scrap(ctx context.Context, movementID uint64, journalID, expenseAccountID uint64, date time.Time) (*CostLayer, error) {
	movement, resolved, err := s.prepareMovement(ctx, nil, movementID, func(m *StockMovement) uint64 { return m.DstLocationID }, ErrNotScrap, "scrap")
	if err != nil {
		return nil, err
	}
	if err := s.requireAccount(resolved.StockValuationAccountID, ErrValuationAccount); err != nil {
		return nil, err
	}
	if err := s.requireAccount(expenseAccountID, ErrScrapAccount); err != nil {
		return nil, err
	}

	qty := amount.FromFloat64(movement.Qty)
	loss := amount.Zero()
	var layer *CostLayer
	if err := s.tx.Run(ctx, func(tx *gorm.DB) error {
		var err error
		loss, err = s.consumeLayers(ctx, tx, movement.ItemID, resolved.CostMethod, amount.FromFloat64(resolved.StandardCost), qty)
		if err != nil {
			return err
		}

		if _, err := s.applyMoveTx(ctx, tx, movementID, date); err != nil {
			return err
		}

		loss = loss.Round(4)
		unitCost, err := loss.Div(qty)
		if err != nil {
			return err
		}
		layer, err = s.postMovementLayer(ctx, tx, movement, qty.Neg(), unitCost, loss.Neg(), false, journalID, date, "SCR", "Goods scrapped", []accounting.PostingLine{
			{AccountID: expenseAccountID, Name: "Scrap Expense", Debit: loss},
			{AccountID: resolved.StockValuationAccountID, Name: "Inventory", Credit: loss},
		})
		return err
	}); err != nil {
		return nil, err
	}
	return layer, nil
}

func (s ValuationService) Restock(ctx context.Context, movementID uint64, unitCost amount.Amount, journalID uint64, date time.Time) (*CostLayer, error) {
	var layer *CostLayer
	err := s.tx.Run(ctx, func(tx *gorm.DB) error {
		var err error
		layer, err = s.RestockTx(ctx, tx, movementID, unitCost, journalID, date)
		return err
	})
	if err != nil {
		return nil, err
	}
	return layer, nil
}

func (s ValuationService) RestockTx(ctx context.Context, tx *gorm.DB, movementID uint64, unitCost amount.Amount, journalID uint64, date time.Time) (*CostLayer, error) {
	movement, resolved, err := s.prepareMovement(ctx, tx, movementID, func(m *StockMovement) uint64 { return m.SrcLocationID }, ErrNotReturn, "customer")
	if err != nil {
		return nil, err
	}
	if unitCost.IsNegative() {
		return nil, ErrNegativeCost
	}
	if err := s.requireAccount(resolved.StockValuationAccountID, ErrValuationAccount); err != nil {
		return nil, err
	}
	if err := s.requireAccount(resolved.CogsAccountID, ErrCogsAccount); err != nil {
		return nil, err
	}

	cost, err := s.receiptCost(resolved, unitCost)
	if err != nil {
		return nil, err
	}

	qty := amount.FromFloat64(movement.Qty)
	value := qty.Mul(cost).Round(4)

	movement.State = MovementStateDone
	movement.DateDone = &date
	if _, err := s.movements.ApplyTx(ctx, tx, movement); err != nil {
		return nil, err
	}

	return s.postMovementLayer(ctx, tx, movement, qty, cost, value, true, journalID, date, "RET", "Customer return restocked", []accounting.PostingLine{
		{AccountID: resolved.StockValuationAccountID, Name: "Inventory", Debit: value},
		{AccountID: resolved.CogsAccountID, Name: "COGS Reversal", Credit: value},
	})
}

func (s ValuationService) ReturnToSupplier(ctx context.Context, movementID uint64, journalID uint64, date time.Time) (*CostLayer, error) {
	movement, resolved, err := s.prepareMovement(ctx, nil, movementID, func(m *StockMovement) uint64 { return m.DstLocationID }, ErrNotSupplierReturn, "supplier")
	if err != nil {
		return nil, err
	}
	if err := s.requireAccount(resolved.StockValuationAccountID, ErrValuationAccount); err != nil {
		return nil, err
	}
	if err := s.requireAccount(resolved.StockInputAccountID, ErrInputAccount); err != nil {
		return nil, err
	}

	qty := amount.FromFloat64(movement.Qty)
	value := amount.Zero()
	var layer *CostLayer
	if err := s.tx.Run(ctx, func(tx *gorm.DB) error {
		var err error
		value, err = s.consumeLayers(ctx, tx, movement.ItemID, resolved.CostMethod, amount.FromFloat64(resolved.StandardCost), qty)
		if err != nil {
			return err
		}

		if _, err := s.applyMoveTx(ctx, tx, movementID, date); err != nil {
			return err
		}

		value = value.Round(4)
		unitCost, err := value.Div(qty)
		if err != nil {
			return err
		}
		layer, err = s.postMovementLayer(ctx, tx, movement, qty.Neg(), unitCost, value.Neg(), false, journalID, date, "VRT", "Goods returned to supplier", []accounting.PostingLine{
			{AccountID: resolved.StockInputAccountID, Name: "Stock Input Reversal", Debit: value},
			{AccountID: resolved.StockValuationAccountID, Name: "Inventory", Credit: value},
		})
		return err
	}); err != nil {
		return nil, err
	}
	return layer, nil
}

func (s ValuationService) Consume(ctx context.Context, movementID uint64, journalID, wipAccountID uint64, date time.Time) (*CostLayer, error) {
	movement, resolved, err := s.prepareMovement(ctx, nil, movementID, func(m *StockMovement) uint64 { return m.DstLocationID }, ErrNotConsumption, "production", "supplier")
	if err != nil {
		return nil, err
	}
	if err := s.requireAccount(resolved.StockValuationAccountID, ErrValuationAccount); err != nil {
		return nil, err
	}
	if err := s.requireAccount(wipAccountID, ErrWIPAccount); err != nil {
		return nil, err
	}

	qty := amount.FromFloat64(movement.Qty)
	consumed := amount.Zero()
	var layer *CostLayer
	if err := s.tx.Run(ctx, func(tx *gorm.DB) error {
		var err error
		consumed, err = s.consumeLayers(ctx, tx, movement.ItemID, resolved.CostMethod, amount.FromFloat64(resolved.StandardCost), qty)
		if err != nil {
			return err
		}

		if _, err := s.applyMoveTx(ctx, tx, movementID, date); err != nil {
			return err
		}

		consumed = consumed.Round(4)
		unitCost, err := consumed.Div(qty)
		if err != nil {
			return err
		}
		layer, err = s.postMovementLayer(ctx, tx, movement, qty.Neg(), unitCost, consumed.Neg(), false, journalID, date, "CON", "Material consumption", []accounting.PostingLine{
			{AccountID: wipAccountID, Name: "Work in Progress", Debit: consumed},
			{AccountID: resolved.StockValuationAccountID, Name: "Inventory", Credit: consumed},
		})
		return err
	}); err != nil {
		return nil, err
	}
	return layer, nil
}

func (s ValuationService) Produce(ctx context.Context, movementID uint64, unitCost amount.Amount, journalID, wipAccountID uint64, date time.Time) (*CostLayer, error) {
	if unitCost.IsNegative() {
		return nil, ErrNegativeCost
	}
	movement, resolved, err := s.prepareMovement(ctx, nil, movementID, func(m *StockMovement) uint64 { return m.SrcLocationID }, ErrNotProduction, "production", "supplier")
	if err != nil {
		return nil, err
	}
	if err := s.requireAccount(resolved.StockValuationAccountID, ErrValuationAccount); err != nil {
		return nil, err
	}
	if err := s.requireAccount(wipAccountID, ErrWIPAccount); err != nil {
		return nil, err
	}

	cost, err := s.receiptCost(resolved, unitCost)
	if err != nil {
		return nil, err
	}

	qty := amount.FromFloat64(movement.Qty)
	value := qty.Mul(cost).Round(4)

	var layer *CostLayer
	if err := s.tx.Run(ctx, func(tx *gorm.DB) error {
		if _, err := s.applyMoveTx(ctx, tx, movementID, date); err != nil {
			return err
		}

		layer, err = s.postMovementLayer(ctx, tx, movement, qty, cost, value, true, journalID, date, "PRD", "Finished goods production", []accounting.PostingLine{
			{AccountID: resolved.StockValuationAccountID, Name: "Inventory", Debit: value},
			{AccountID: wipAccountID, Name: "Work in Progress", Credit: value},
		})
		return err
	}); err != nil {
		return nil, err
	}
	return layer, nil
}

func (s ValuationService) consumeLayers(ctx context.Context, tx *gorm.DB, itemID uint64, method string, standardCost, qty amount.Amount) (amount.Amount, error) {
	switch method {
	case "average":
		return s.consumeAverage(ctx, tx, itemID, qty)
	case "standard":
		return s.consumeStandard(ctx, tx, itemID, qty, standardCost)
	default:
		return s.consumeFIFO(ctx, tx, itemID, qty)
	}
}

func (s ValuationService) receiptCost(resolved ResolvedItem, actual amount.Amount) (amount.Amount, error) {
	if resolved.CostMethod != "standard" {
		return actual, nil
	}
	standardCost := amount.FromFloat64(resolved.StandardCost)
	if standardCost.IsNegative() {
		return amount.Amount{}, ErrNegativeCost
	}
	if standardCost.IsZero() {
		return amount.Amount{}, ErrStandardCostMissing
	}
	return standardCost.Round(4), nil
}

func (s ValuationService) consumeStandard(ctx context.Context, tx *gorm.DB, itemID uint64, qty, standardCost amount.Amount) (amount.Amount, error) {
	if standardCost.IsNegative() {
		return amount.Amount{}, ErrNegativeCost
	}
	if standardCost.IsZero() {
		return amount.Amount{}, ErrStandardCostMissing
	}
	openLayers, err := s.layers.ListOpenByItemForUpdateTx(ctx, tx, itemID)
	if err != nil {
		return amount.Amount{}, err
	}
	onHand := amount.Zero()
	for _, layer := range openLayers {
		onHand = onHand.Add(amount.FromFloat64(layer.RemainingQty))
	}
	if qty.GreaterThan(onHand) {
		return amount.Amount{}, ErrInsufficientStock
	}
	remaining := qty
	consumed := amount.Zero()
	for _, layer := range openLayers {
		if remaining.IsZero() {
			break
		}
		layerQty := amount.FromFloat64(layer.RemainingQty)
		consumedQty := layerQty
		if layerQty.GreaterThan(remaining) {
			consumedQty = remaining
		}
		decrement := consumedQty.Mul(standardCost).Round(4)
		layerValue := amount.FromFloat64(layer.RemainingValue)
		if decrement.GreaterThan(layerValue) {
			decrement = layerValue
		}
		layer.RemainingQty = layerQty.Sub(consumedQty).Round(4).Float64()
		layer.RemainingValue = layerValue.Sub(decrement).Round(4).Float64()
		if _, err := s.layers.UpdateTx(ctx, tx, layer); err != nil {
			return amount.Amount{}, err
		}
		consumed = consumed.Add(decrement)
		remaining = remaining.Sub(consumedQty)
	}
	if remaining.IsPositive() {
		return amount.Amount{}, ErrInsufficientStock
	}
	return consumed, nil
}

func (s ValuationService) consumeFIFO(ctx context.Context, tx *gorm.DB, itemID uint64, qty amount.Amount) (amount.Amount, error) {
	openLayers, err := s.layers.ListOpenByItemForUpdateTx(ctx, tx, itemID)
	if err != nil {
		return amount.Amount{}, err
	}
	onHand := amount.Zero()
	for _, layer := range openLayers {
		onHand = onHand.Add(amount.FromFloat64(layer.RemainingQty))
	}
	if qty.GreaterThan(onHand) {
		return amount.Amount{}, ErrInsufficientStock
	}
	remaining := qty
	consumed := amount.Zero()
	for _, layer := range openLayers {
		if remaining.IsZero() {
			break
		}
		layerQty := amount.FromFloat64(layer.RemainingQty)
		layerValue := amount.FromFloat64(layer.RemainingValue)
		consumedQty := layerQty
		fullConsumption := !layerQty.GreaterThan(remaining)
		if layerQty.GreaterThan(remaining) {
			consumedQty = remaining
		}
		var decrement amount.Amount
		if fullConsumption {
			decrement = layerValue
			layer.RemainingQty = 0
			layer.RemainingValue = 0
		} else {
			unitCost := amount.FromFloat64(derefFloat(layer.UnitCost))
			decrement = consumedQty.Mul(unitCost).Round(4)
			layer.RemainingQty -= consumedQty.Float64()
			layer.RemainingValue -= decrement.Float64()
		}
		if _, err := s.layers.UpdateTx(ctx, tx, layer); err != nil {
			return amount.Amount{}, err
		}
		consumed = consumed.Add(decrement)
		remaining = remaining.Sub(consumedQty)
	}
	if remaining.IsPositive() {
		return amount.Amount{}, ErrInsufficientStock
	}
	return consumed, nil
}

func (s ValuationService) consumeAverage(ctx context.Context, tx *gorm.DB, itemID uint64, qty amount.Amount) (amount.Amount, error) {
	openLayers, err := s.layers.ListOpenByItemForUpdateTx(ctx, tx, itemID)
	if err != nil {
		return amount.Amount{}, err
	}
	totalQty := amount.Zero()
	totalValue := amount.Zero()
	for _, layer := range openLayers {
		totalQty = totalQty.Add(amount.FromFloat64(layer.RemainingQty))
		totalValue = totalValue.Add(amount.FromFloat64(layer.RemainingValue))
	}
	if qty.GreaterThan(totalQty) || totalQty.IsZero() {
		return amount.Amount{}, ErrInsufficientStock
	}
	avgCost, err := totalValue.Div(totalQty)
	if err != nil {
		return amount.Amount{}, ErrInsufficientStock
	}
	avgCost = avgCost.Round(4)
	fraction, err := qty.Div(totalQty)
	if err != nil {
		return amount.Amount{}, err
	}
	totalConsumed := qty.Mul(avgCost).Round(4)
	consumedQty := amount.Zero()
	consumedValue := amount.Zero()
	for i, layer := range openLayers {
		if consumedQty.Equal(qty) {
			break
		}
		last := i == len(openLayers)-1
		layerQty := amount.FromFloat64(layer.RemainingQty)
		layerValue := amount.FromFloat64(layer.RemainingValue)
		consume := layerQty.Mul(fraction).Round(4)
		decrement := layerValue.Mul(fraction).Round(4)
		if last {
			consume = qty.Sub(consumedQty)
			decrement = totalConsumed.Sub(consumedValue)
		}
		if consume.GreaterThan(layerQty) {
			consume = layerQty
		}
		if consume.IsNegative() {
			consume = amount.Zero()
		}
		if decrement.GreaterThan(layerValue) {
			decrement = layerValue
		}
		if decrement.IsNegative() {
			decrement = amount.Zero()
		}
		layer.RemainingQty = layerQty.Sub(consume).Round(4).Float64()
		layer.RemainingValue = layerValue.Sub(decrement).Round(4).Float64()
		if _, err := s.layers.UpdateTx(ctx, tx, layer); err != nil {
			return amount.Amount{}, err
		}
		consumedQty = consumedQty.Add(consume).Round(4)
		consumedValue = consumedValue.Add(decrement).Round(4)
	}
	if !consumedQty.Equal(qty) {
		return amount.Amount{}, ErrInsufficientStock
	}
	return totalConsumed, nil
}

func (s ValuationService) OnHandValue(ctx context.Context, itemID uint64) (amount.Amount, error) {
	value, err := s.layers.ValueForItem(ctx, itemID)
	if err != nil {
		return amount.Amount{}, err
	}
	return amount.FromFloat64(value).Round(4), nil
}

func (s ValuationService) enforceLot(ctx context.Context, resolved ResolvedItem, movement *StockMovement) error {
	if resolved.Tracking != "none" && movement.BatchID == nil {
		return ErrBatchRequired
	}
	return nil
}

func (s ValuationService) requireOrganization(movement *StockMovement) error {
	if movement.OrganizationID == nil {
		return ErrOrganizationMissing
	}
	return nil
}

func derefFloat(value *float64) float64 {
	if value == nil {
		return 0
	}
	return *value
}

func currentUnitCost(openLayers []*CostLayer) amount.Amount {
	totalQty := amount.Zero()
	totalValue := amount.Zero()
	for _, layer := range openLayers {
		totalQty = totalQty.Add(amount.FromFloat64(layer.RemainingQty))
		totalValue = totalValue.Add(amount.FromFloat64(layer.RemainingValue))
	}
	if totalQty.IsZero() {
		return amount.Zero()
	}
	unit, err := totalValue.Div(totalQty)
	if err != nil {
		return amount.Zero()
	}
	return unit.Round(4)
}
