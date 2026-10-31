package inquiry

import (
	"context"
	"errors"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type ContactInquiryDAO interface {
	dao.CRUD[ContactInquiry]
}

// ContactInquiryConversionDAO claims an inquiry before creating its lead so
// concurrent conversion requests cannot create duplicate leads.
type ContactInquiryConversionDAO interface {
	ClaimForConversion(ctx context.Context, id, organizationID uint64, claimID string) (*ContactInquiry, error)
	LinkConversion(ctx context.Context, id, organizationID uint64, claimID string, prospectID uint64) (*ContactInquiry, error)
	ReleaseConversionClaim(ctx context.Context, id, organizationID uint64, claimID string) error
}

const conversionClaimTTL = 10 * time.Minute

type contactInquiryDAO struct {
	dao.Base[ContactInquiry]
	db *gorm.DB
}

func NewContactInquiryDAO(db *gorm.DB) ContactInquiryDAO {
	return contactInquiryDAO{Base: dao.NewBase[ContactInquiry](db), db: db}
}

func (d contactInquiryDAO) ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[ContactInquiry], error) {
	var count int64
	var entities []ContactInquiry

	tenantScope := "organization_id = ?"

	countTx := d.db.WithContext(ctx).Model(&entities).Where(tenantScope, organizationID)
	if q != nil {
		countTx = query.ApplyFilters(countTx, q.Filters)
	}
	if err := countTx.Count(&count).Error; err != nil {
		return nil, err
	}

	tx := d.db.WithContext(ctx).Model(&entities).Where(tenantScope, organizationID)
	if q != nil {
		tx = query.ApplyQuery(tx, q)
	}
	if err := tx.Find(&entities).Error; err != nil {
		return nil, err
	}

	items := make([]*ContactInquiry, len(entities))
	for i := range entities {
		items[i] = &entities[i]
	}
	return &query.Page[ContactInquiry]{Items: items, Count: count}, nil
}

func (d contactInquiryDAO) FindInOrg(ctx context.Context, id, organizationID uint64) (*ContactInquiry, error) {
	var entity ContactInquiry
	err := d.db.WithContext(ctx).
		Where("id = ? AND organization_id = ?", id, organizationID).
		First(&entity).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &entity, nil
}

func (d contactInquiryDAO) ClaimForConversion(ctx context.Context, id, organizationID uint64, claimID string) (*ContactInquiry, error) {
	var entity ContactInquiry
	err := d.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("id = ? AND deleted_at IS NULL AND (organization_id = ? OR organization_id IS NULL)", id, organizationID).
			First(&entity).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrInquiryNotFound
			}
			return err
		}
		if entity.ProspectID != nil {
			return ErrAlreadyConverted
		}
		if entity.ConversionClaimID != nil && *entity.ConversionClaimID != "" &&
			entity.ConversionClaimedAt != nil && time.Since(*entity.ConversionClaimedAt) < conversionClaimTTL {
			return ErrConversionInProgress
		}

		now := time.Now().UTC()
		if err := tx.Model(&ContactInquiry{}).Where("id = ?", id).Updates(map[string]any{
			"conversion_claim_id":   claimID,
			"conversion_claimed_at": now,
		}).Error; err != nil {
			return err
		}
		entity.ConversionClaimID = &claimID
		entity.ConversionClaimedAt = &now
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &entity, nil
}

func (d contactInquiryDAO) LinkConversion(ctx context.Context, id, organizationID uint64, claimID string, prospectID uint64) (*ContactInquiry, error) {
	var entity ContactInquiry
	err := d.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("id = ? AND deleted_at IS NULL AND (organization_id = ? OR organization_id IS NULL)", id, organizationID).
			First(&entity).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrInquiryNotFound
			}
			return err
		}
		if entity.ProspectID != nil {
			return ErrAlreadyConverted
		}
		if entity.ConversionClaimID == nil || *entity.ConversionClaimID != claimID {
			return ErrConversionInProgress
		}

		if err := tx.Model(&ContactInquiry{}).Where("id = ?", id).Updates(map[string]any{
			"prospect_id":           prospectID,
			"status":                StatusReviewed,
			"organization_id":       gorm.Expr("COALESCE(organization_id, ?)", organizationID),
			"conversion_claim_id":   nil,
			"conversion_claimed_at": nil,
		}).Error; err != nil {
			return err
		}
		entity.ProspectID = &prospectID
		entity.Status = StatusReviewed
		if entity.OrganizationID == nil {
			entity.OrganizationID = &organizationID
		}
		entity.ConversionClaimID = nil
		entity.ConversionClaimedAt = nil
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &entity, nil
}

func (d contactInquiryDAO) ReleaseConversionClaim(ctx context.Context, id, organizationID uint64, claimID string) error {
	return d.db.WithContext(ctx).
		Model(&ContactInquiry{}).
		Where("id = ? AND conversion_claim_id = ? AND deleted_at IS NULL AND (organization_id = ? OR organization_id IS NULL)", id, claimID, organizationID).
		Updates(map[string]any{
			"conversion_claim_id":   nil,
			"conversion_claimed_at": nil,
		}).Error
}
