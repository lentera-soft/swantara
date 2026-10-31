package commission

import (
	"context"
	"errors"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"gorm.io/gorm"
)

type CommissionPlanDAO interface {
	dao.CRUD[CommissionPlan]
}

type commissionPlanDAO struct {
	dao.Base[CommissionPlan]
}

func NewCommissionPlanDAO(db *gorm.DB) CommissionPlanDAO {
	return commissionPlanDAO{Base: dao.NewBase[CommissionPlan](db)}
}

type CommissionRuleDAO interface {
	dao.CRUD[CommissionRule]
	CreateTx(ctx context.Context, tx *gorm.DB, entity *CommissionRule) (*CommissionRule, error)
	ListByPlan(ctx context.Context, planID uint64) ([]*CommissionRule, error)
}

type commissionRuleDAO struct {
	dao.Base[CommissionRule]
	db *gorm.DB
}

func NewCommissionRuleDAO(db *gorm.DB) CommissionRuleDAO {
	return commissionRuleDAO{Base: dao.NewBase[CommissionRule](db), db: db}
}

func (d commissionRuleDAO) CreateTx(ctx context.Context, tx *gorm.DB, entity *CommissionRule) (*CommissionRule, error) {
	if err := tx.WithContext(ctx).Create(entity).Error; err != nil {
		return nil, err
	}
	return entity, nil
}

func (d commissionRuleDAO) ListByPlan(ctx context.Context, planID uint64) ([]*CommissionRule, error) {
	page, err := d.List(ctx, &query.Query{Filters: []query.Filter{{Field: "plan_id", Operator: query.Equal, Value: planID}}})
	if err != nil {
		return nil, err
	}
	return page.Items, nil
}

type CommissionAssignmentDAO interface {
	dao.CRUD[CommissionAssignment]
	CreateTx(ctx context.Context, tx *gorm.DB, entity *CommissionAssignment) (*CommissionAssignment, error)
}

type commissionAssignmentDAO struct {
	dao.Base[CommissionAssignment]
	db *gorm.DB
}

func NewCommissionAssignmentDAO(db *gorm.DB) CommissionAssignmentDAO {
	return commissionAssignmentDAO{Base: dao.NewBase[CommissionAssignment](db), db: db}
}

func (d commissionAssignmentDAO) CreateTx(ctx context.Context, tx *gorm.DB, entity *CommissionAssignment) (*CommissionAssignment, error) {
	if err := tx.WithContext(ctx).Create(entity).Error; err != nil {
		return nil, err
	}
	return entity, nil
}

type CommissionEntryDAO interface {
	dao.CRUD[CommissionEntry]
	CreateTx(ctx context.Context, tx *gorm.DB, entity *CommissionEntry) (*CommissionEntry, error)
	UpdateTx(ctx context.Context, tx *gorm.DB, entity *CommissionEntry) (*CommissionEntry, error)
}

type commissionEntryDAO struct {
	dao.Base[CommissionEntry]
	db *gorm.DB
}

func NewCommissionEntryDAO(db *gorm.DB) CommissionEntryDAO {
	return commissionEntryDAO{Base: dao.NewBase[CommissionEntry](db), db: db}
}

func (d commissionEntryDAO) CreateTx(ctx context.Context, tx *gorm.DB, entity *CommissionEntry) (*CommissionEntry, error) {
	if err := tx.WithContext(ctx).Create(entity).Error; err != nil {
		return nil, err
	}
	return entity, nil
}

func (d commissionEntryDAO) UpdateTx(ctx context.Context, tx *gorm.DB, entity *CommissionEntry) (*CommissionEntry, error) {
	if err := tx.WithContext(ctx).Save(entity).Error; err != nil {
		return nil, err
	}
	return entity, nil
}

func (d commissionEntryDAO) ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[CommissionEntry], error) {
	planIDs := d.db.Model(&CommissionPlan{}).Select("id").Where("organization_id = ?", organizationID)

	var count int64
	var entities []CommissionEntry

	countTx := d.db.WithContext(ctx).Model(&CommissionEntry{}).Where("plan_id IN (?)", planIDs)
	if q != nil {
		countTx = query.ApplyFilters(countTx, q.Filters)
	}
	if err := countTx.Count(&count).Error; err != nil {
		return nil, err
	}

	tx := d.db.WithContext(ctx).Model(&CommissionEntry{}).Where("plan_id IN (?)", planIDs)
	if q != nil {
		tx = query.ApplyQuery(tx, q)
	}
	if err := tx.Find(&entities).Error; err != nil {
		return nil, err
	}

	items := make([]*CommissionEntry, len(entities))
	for i := range entities {
		items[i] = &entities[i]
	}
	return &query.Page[CommissionEntry]{Items: items, Count: count}, nil
}

func (d commissionEntryDAO) FindInOrg(ctx context.Context, id, organizationID uint64) (*CommissionEntry, error) {
	planIDs := d.db.Model(&CommissionPlan{}).Select("id").Where("organization_id = ?", organizationID)

	var entity CommissionEntry
	err := d.db.WithContext(ctx).Where("id = ? AND plan_id IN (?)", id, planIDs).First(&entity).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, dao.ErrNotFound
		}
		return nil, err
	}
	return &entity, nil
}
