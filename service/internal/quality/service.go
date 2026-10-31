package quality

import (
	"context"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/kernel/amount"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/kernel/state"
	"github.com/jalusw/swantara/apps/service/internal/reference"

	"github.com/jalusw/swantara/apps/service/internal/kernel/clock"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type QualityPointService struct {
	points QualityPointDAO
}

func NewQualityPointService(points QualityPointDAO) QualityPointService {
	return QualityPointService{points: points}
}

func (s QualityPointService) ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[reference.QualityPoint], error) {
	return s.points.ListInOrg(ctx, q, organizationID)
}

func (s QualityPointService) FindInOrg(ctx context.Context, id, organizationID uint64) (*reference.QualityPoint, error) {
	return s.points.FindInOrg(ctx, id, organizationID)
}

func (s QualityPointService) Create(ctx context.Context, point *reference.QualityPoint) (*reference.QualityPoint, error) {
	return s.points.Create(ctx, point)
}

func (s QualityPointService) Update(ctx context.Context, point *reference.QualityPoint) (*reference.QualityPoint, error) {
	return s.points.Update(ctx, point)
}

type QualityCheckService struct {
	points  QualityPointDAO
	checks  QualityCheckDAO
	alerts  QualityAlertDAO
	scrap   ScrapRouter
	machine state.Machine
	now     func() time.Time
}

func NewQualityCheckService(points QualityPointDAO, checks QualityCheckDAO, alerts QualityAlertDAO) QualityCheckService {
	return QualityCheckService{
		points: points,
		checks: checks,
		alerts: alerts,
		machine: state.NewMachine(
			state.Transition{From: model.Status(AlertStateOpen), To: model.Status(AlertStateInProgress)},
			state.Transition{From: model.Status(AlertStateOpen), To: model.Status(AlertStateCancelled)},
			state.Transition{From: model.Status(AlertStateInProgress), To: model.Status(AlertStateSolved)},
			state.Transition{From: model.Status(AlertStateInProgress), To: model.Status(AlertStateCancelled)},
		),
		now: clock.Now,
	}
}

func (s QualityCheckService) WithScrapRouter(scrap ScrapRouter) QualityCheckService {
	s.scrap = scrap
	return s
}

func (s QualityCheckService) TriggerChecks(ctx context.Context, organizationID uint64, shipmentID uint64, itemIDs []uint64) (int, error) {
	created := 0
	for _, itemID := range itemIDs {
		points, err := s.points.ListByItem(ctx, itemID)
		if err != nil {
			return 0, err
		}
		for _, point := range points {
			if point.OrganizationID != nil && *point.OrganizationID != organizationID {
				continue
			}
			if _, err := s.checks.Create(ctx, &QualityCheck{
				PointID:    helper.Ptr(point.ID),
				ItemID:     helper.Ptr(itemID),
				ShipmentID: helper.Ptr(shipmentID),
				Result:     CheckResultPending,
			}); err != nil {
				return 0, err
			}
			created++
		}
	}
	return created, nil
}

func (s QualityCheckService) CreateCheck(ctx context.Context, check *QualityCheck) (*QualityCheck, error) {
	if check.ItemID == nil || *check.ItemID == 0 {
		return nil, ErrQualityCheckNoProduct
	}
	if check.Result == "" {
		check.Result = CheckResultPending
	}
	return s.checks.Create(ctx, check)
}

func (s QualityCheckService) RecordResult(ctx context.Context, checkID uint64, pass bool, measuredValue *float64, checkedBy uint64) (*QualityCheck, error) {
	check, err := s.checks.Find(ctx, checkID)
	if err != nil {
		return nil, dao.NotFound(err, ErrQualityCheckNotFound)
	}
	if check == nil {
		return nil, ErrQualityCheckNotFound
	}
	if check.Result != CheckResultPending {
		return nil, ErrQualityCheckDone
	}
	if check.PointID == nil {
		return nil, ErrQualityCheckNoProduct
	}
	point, err := s.points.Find(ctx, *check.PointID)
	if err != nil {
		return nil, dao.NotFound(err, ErrQualityPointNotFound)
	}
	if point == nil {
		return nil, ErrQualityPointNotFound
	}

	now := s.now()
	if point.TestType == TestTypeMeasure {
		if measuredValue == nil {
			return nil, ErrQualityCheckNoValue
		}
		pass = s.inRange(point, *measuredValue)
	}

	check.Result = CheckResultPass
	if !pass {
		check.Result = CheckResultFail
	}
	check.MeasuredValue = measuredValue
	check.CheckedBy = helper.Ptr(checkedBy)
	check.CheckedAt = &now

	updated, err := s.checks.Update(ctx, check)
	if err != nil {
		return nil, err
	}

	if !pass {
		if _, err := s.alerts.Create(ctx, &QualityAlert{
			ItemID:      check.ItemID,
			BatchID:     check.BatchID,
			CheckID:     helper.Ptr(check.ID),
			Title:       helper.Ptr("Quality check failed"),
			Description: point.Operation,
			Severity:    helper.Ptr("warning"),
			State:       AlertStateOpen,
		}); err != nil {
			return nil, err
		}
	}
	return updated, nil
}

func (s QualityCheckService) HasFailedChecks(ctx context.Context, shipmentID uint64) (bool, error) {
	checks, err := s.checks.ListByShipment(ctx, shipmentID)
	if err != nil {
		return false, err
	}
	for _, check := range checks {
		if check.Result == CheckResultFail {
			return true, nil
		}
	}
	return false, nil
}

func (s QualityCheckService) RouteFailedToScrap(ctx context.Context, organizationID, shipmentID uint64, journalID, expenseAccountID uint64, date time.Time) ([]uint64, error) {
	if s.scrap == nil {
		return nil, ErrQualityScrapRouter
	}
	checks, err := s.checks.ListByShipment(ctx, shipmentID)
	if err != nil {
		return nil, err
	}
	scrapped := make([]uint64, 0, len(checks))
	for _, check := range checks {
		if check.Result != CheckResultFail || check.ItemID == nil {
			continue
		}
		if err := s.scrap.RouteToScrap(ctx, organizationID, shipmentID, *check.ItemID, journalID, expenseAccountID, date); err != nil {
			return nil, err
		}
		scrapped = append(scrapped, *check.ItemID)
	}
	return scrapped, nil
}

func (s QualityCheckService) ListChecksInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[QualityCheck], error) {
	return s.checks.ListInOrg(ctx, q, organizationID)
}

func (s QualityCheckService) FindCheckInOrg(ctx context.Context, id, organizationID uint64) (*QualityCheck, error) {
	return s.checks.FindInOrg(ctx, id, organizationID)
}

func (s QualityCheckService) ListAlertsInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[QualityAlert], error) {
	return s.alerts.ListInOrg(ctx, q, organizationID)
}

func (s QualityCheckService) FindAlertInOrg(ctx context.Context, id, organizationID uint64) (*QualityAlert, error) {
	return s.alerts.FindInOrg(ctx, id, organizationID)
}

func (s QualityCheckService) SetAlertState(ctx context.Context, alertID uint64, next string) (*QualityAlert, error) {
	alert, err := s.alerts.Find(ctx, alertID)
	if err != nil {
		return nil, dao.NotFound(err, ErrQualityAlertNotFound)
	}
	if alert == nil {
		return nil, ErrQualityAlertNotFound
	}
	if err := s.machine.TryTransition(model.Status(alert.State), model.Status(next)); err != nil {
		return nil, ErrQualityAlertState
	}
	alert.State = next
	return s.alerts.Update(ctx, alert)
}

func (s QualityCheckService) inRange(point *reference.QualityPoint, value float64) bool {
	amountValue := amount.FromFloat64(value)
	if point.NormMin != nil && amountValue.LessThan(amount.FromFloat64(*point.NormMin)) {
		return false
	}
	if point.NormMax != nil && amountValue.GreaterThan(amount.FromFloat64(*point.NormMax)) {
		return false
	}
	return true
}
