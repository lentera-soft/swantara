package crm

import (
	"context"
	"errors"
	"strings"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"gorm.io/gorm"
)

type ProspectDAO interface {
	dao.CRUD[Prospect]
	ListOpen(ctx context.Context, organizationID *uint64) ([]*Prospect, error)
	CountWon(ctx context.Context, organizationID *uint64) (int64, error)
	CountLost(ctx context.Context, organizationID *uint64) (int64, error)
	FindDuplicates(ctx context.Context, organizationID uint64, name, email, phone string, excludeID uint64) ([]*Prospect, error)
	Merge(ctx context.Context, sourceID, targetID uint64) error
	ReassignOwners(ctx context.Context, organizationID uint64, prospectIDs []uint64, ownerUserID *uint64) error
}

type crmLeadDAO struct {
	dao.Base[Prospect]
	db *gorm.DB
}

func NewProspectDAO(db *gorm.DB) ProspectDAO {
	return crmLeadDAO{Base: dao.NewBase[Prospect](db), db: db}
}

func (d crmLeadDAO) ListOpen(ctx context.Context, organizationID *uint64) ([]*Prospect, error) {
	var leads []Prospect
	tx := d.db.WithContext(ctx).
		Where("type = ?", ProspectKindOpportunity).
		Where("closed_at IS NULL")
	if organizationID != nil {
		tx = tx.Where("organization_id = ?", *organizationID)
	}
	err := tx.Find(&leads).Error
	if err != nil {
		return nil, err
	}
	items := make([]*Prospect, len(leads))
	for i := range leads {
		items[i] = &leads[i]
	}
	return items, nil
}

func (d crmLeadDAO) CountWon(ctx context.Context, organizationID *uint64) (int64, error) {
	var count int64
	tx := d.db.WithContext(ctx).Model(&Prospect{}).
		Joins("JOIN pipeline_stages ON pipeline_stages.id = prospects.stage_id").
		Where("prospects.type = ?", ProspectKindOpportunity).
		Where("pipeline_stages.is_won = true")
	if organizationID != nil {
		tx = tx.Where("prospects.organization_id = ?", *organizationID)
	}
	err := tx.Count(&count).Error
	return count, err
}

func (d crmLeadDAO) CountLost(ctx context.Context, organizationID *uint64) (int64, error) {
	var count int64
	tx := d.db.WithContext(ctx).Model(&Prospect{}).
		Where("type = ?", ProspectKindOpportunity).
		Where("lost_reason IS NOT NULL")
	if organizationID != nil {
		tx = tx.Where("organization_id = ?", *organizationID)
	}
	err := tx.Count(&count).Error
	return count, err
}

func (d crmLeadDAO) FindDuplicates(ctx context.Context, organizationID uint64, name, email, phone string, excludeID uint64) ([]*Prospect, error) {
	conditions := make([]string, 0, 3)
	args := make([]any, 0, 3)
	if strings.TrimSpace(email) != "" {
		conditions = append(conditions, "lower(email) = lower(?)")
		args = append(args, strings.TrimSpace(email))
	}
	if strings.TrimSpace(phone) != "" {
		conditions = append(conditions, "regexp_replace(phone, '[^0-9]', '', 'g') = regexp_replace(?, '[^0-9]', '', 'g')")
		args = append(args, strings.TrimSpace(phone))
	}
	if strings.TrimSpace(name) != "" {
		conditions = append(conditions, "lower(name) = lower(?)")
		args = append(args, strings.TrimSpace(name))
	}
	if len(conditions) == 0 {
		return []*Prospect{}, nil
	}

	var prospects []Prospect
	tx := d.db.WithContext(ctx).Model(&Prospect{}).
		Where("organization_id = ?", organizationID).
		Where("("+strings.Join(conditions, " OR ")+")", args...)
	if excludeID > 0 {
		tx = tx.Where("id <> ?", excludeID)
	}
	if err := tx.Find(&prospects).Error; err != nil {
		return nil, err
	}
	items := make([]*Prospect, len(prospects))
	for i := range prospects {
		items[i] = &prospects[i]
	}
	return items, nil
}

func (d crmLeadDAO) ReassignOwners(ctx context.Context, organizationID uint64, prospectIDs []uint64, ownerUserID *uint64) error {
	if len(prospectIDs) == 0 {
		return nil
	}
	return d.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		result := tx.Model(&Prospect{}).
			Where("organization_id = ? AND id IN ?", organizationID, prospectIDs).
			Update("owner_user_id", ownerUserID)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected != int64(len(prospectIDs)) {
			return dao.ErrNotFound
		}
		return nil
	})
}

func (d crmLeadDAO) Merge(ctx context.Context, sourceID, targetID uint64) error {
	return d.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec("UPDATE prospect_activities SET lead_id = ? WHERE lead_id = ?", targetID, sourceID).Error; err != nil {
			return err
		}
		if err := tx.Exec(
			"DELETE FROM prospect_contacts AS source USING prospect_contacts AS target "+
				"WHERE source.prospect_id = ? AND target.prospect_id = ? "+
				"AND source.contact_id = target.contact_id AND source.deleted_at IS NULL AND target.deleted_at IS NULL",
			sourceID, targetID,
		).Error; err != nil {
			return err
		}
		if err := tx.Exec("UPDATE prospect_contacts SET prospect_id = ? WHERE prospect_id = ?", targetID, sourceID).Error; err != nil {
			return err
		}
		if err := tx.Exec("UPDATE prospect_stage_histories SET prospect_id = ? WHERE prospect_id = ?", targetID, sourceID).Error; err != nil {
			return err
		}
		return tx.Delete(&Prospect{}, sourceID).Error
	})
}

type ProspectActivityDAO interface {
	dao.CRUD[ProspectActivity]
	ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[ProspectActivity], error)
	FindInOrg(ctx context.Context, id, organizationID uint64) (*ProspectActivity, error)
}

type crmActivityDAO struct {
	dao.Base[ProspectActivity]
	db *gorm.DB
}

func NewProspectActivityDAO(db *gorm.DB) ProspectActivityDAO {
	return crmActivityDAO{Base: dao.NewBase[ProspectActivity](db), db: db}
}

func (d crmActivityDAO) ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[ProspectActivity], error) {
	var count int64
	var entities []ProspectActivity

	join := "LEFT JOIN prospects ON prospects.id = prospect_activities.lead_id " +
		"LEFT JOIN contacts ON contacts.id = prospect_activities.contact_id"

	tenantScope := "(prospect_activities.lead_id IS NOT NULL AND prospects.organization_id = ?) " +
		"OR (prospect_activities.lead_id IS NULL AND prospect_activities.contact_id IS NOT NULL AND contacts.organization_id = ?)"

	countTx := d.db.WithContext(ctx).Model(&entities).Joins(join).Where(tenantScope, organizationID, organizationID)
	if q != nil {
		countTx = query.ApplyFilters(countTx, q.Filters)
	}
	if err := countTx.Count(&count).Error; err != nil {
		return nil, err
	}

	tx := d.db.WithContext(ctx).Model(&entities).Joins(join).Where(tenantScope, organizationID, organizationID)
	if q != nil {
		tx = query.ApplyQuery(tx, q)
	}
	if err := tx.Find(&entities).Error; err != nil {
		return nil, err
	}

	items := make([]*ProspectActivity, len(entities))
	for i := range entities {
		items[i] = &entities[i]
	}

	return &query.Page[ProspectActivity]{Items: items, Count: count}, nil
}

func (d crmActivityDAO) FindInOrg(ctx context.Context, id, organizationID uint64) (*ProspectActivity, error) {
	var activity ProspectActivity
	err := d.db.WithContext(ctx).Model(&ProspectActivity{}).
		Joins("LEFT JOIN prospects ON prospects.id = prospect_activities.lead_id "+
			"LEFT JOIN contacts ON contacts.id = prospect_activities.contact_id").
		Where("prospect_activities.id = ?", id).
		Where("(prospect_activities.lead_id IS NOT NULL AND prospects.organization_id = ?) "+
			"OR (prospect_activities.lead_id IS NULL AND prospect_activities.contact_id IS NOT NULL AND contacts.organization_id = ?)", organizationID, organizationID).
		Take(&activity).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, dao.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &activity, nil
}

type StageHistoryDAO interface {
	Create(ctx context.Context, entry *ProspectStageHistory) (*ProspectStageHistory, error)
	ListByProspect(ctx context.Context, prospectID uint64) ([]*ProspectStageHistory, error)
	ListInOrg(ctx context.Context, organizationID uint64) ([]*ProspectStageHistory, error)
}

type crmStageHistoryDAO struct {
	dao.Base[ProspectStageHistory]
	db *gorm.DB
}

func NewStageHistoryDAO(db *gorm.DB) StageHistoryDAO {
	return crmStageHistoryDAO{Base: dao.NewBase[ProspectStageHistory](db), db: db}
}

func (d crmStageHistoryDAO) ListInOrg(ctx context.Context, organizationID uint64) ([]*ProspectStageHistory, error) {
	var entries []ProspectStageHistory
	if err := d.db.WithContext(ctx).
		Model(&ProspectStageHistory{}).
		Joins("JOIN prospects ON prospects.id = prospect_stage_histories.prospect_id").
		Where("prospects.organization_id = ? AND prospects.deleted_at IS NULL", organizationID).
		Order("prospect_stage_histories.prospect_id ASC, prospect_stage_histories.created_at ASC, prospect_stage_histories.id ASC").
		Find(&entries).Error; err != nil {
		return nil, err
	}
	items := make([]*ProspectStageHistory, len(entries))
	for i := range entries {
		items[i] = &entries[i]
	}
	return items, nil
}

func (d crmStageHistoryDAO) ListByProspect(ctx context.Context, prospectID uint64) ([]*ProspectStageHistory, error) {
	var entries []ProspectStageHistory
	if err := d.db.WithContext(ctx).
		Where("prospect_id = ?", prospectID).
		Order("created_at ASC, id ASC").
		Find(&entries).Error; err != nil {
		return nil, err
	}
	items := make([]*ProspectStageHistory, len(entries))
	for i := range entries {
		items[i] = &entries[i]
	}
	return items, nil
}

type ProspectContactDAO interface {
	ListByProspect(ctx context.Context, prospectID uint64) ([]*ProspectContact, error)
	Find(ctx context.Context, id uint64) (*ProspectContact, error)
	Create(ctx context.Context, entry *ProspectContact) (*ProspectContact, error)
	Delete(ctx context.Context, id uint64) error
	ClearPrimary(ctx context.Context, prospectID uint64) error
}

type crmProspectContactDAO struct {
	dao.Base[ProspectContact]
	db *gorm.DB
}

func NewProspectContactDAO(db *gorm.DB) ProspectContactDAO {
	return crmProspectContactDAO{Base: dao.NewBase[ProspectContact](db), db: db}
}

func (d crmProspectContactDAO) ListByProspect(ctx context.Context, prospectID uint64) ([]*ProspectContact, error) {
	var entries []ProspectContact
	if err := d.db.WithContext(ctx).
		Where("prospect_id = ?", prospectID).
		Order("is_primary DESC, id ASC").
		Find(&entries).Error; err != nil {
		return nil, err
	}
	items := make([]*ProspectContact, len(entries))
	for i := range entries {
		items[i] = &entries[i]
	}
	return items, nil
}

func (d crmProspectContactDAO) ClearPrimary(ctx context.Context, prospectID uint64) error {
	return d.db.WithContext(ctx).
		Model(&ProspectContact{}).
		Where("prospect_id = ? AND is_primary = ?", prospectID, true).
		Update("is_primary", false).Error
}
