package localization

import (
	"context"

	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/reference"
	"gorm.io/gorm"
)

type ProfileDAO interface {
	dao.CRUD[Profile]
}

type profileDAO struct {
	dao.Base[Profile]
}

func NewProfileDAO(db *gorm.DB) ProfileDAO {
	return profileDAO{Base: dao.NewBase[Profile](db)}
}

type TaxTemplateLineDAO interface {
	dao.CRUD[TaxTemplateLine]
	ListByProfile(ctx context.Context, profileID uint64) ([]*TaxTemplateLine, error)
	ReplaceForProfile(ctx context.Context, profileID uint64, lines []*TaxTemplateLine) error
}

type taxTemplateLineDAO struct {
	dao.Base[TaxTemplateLine]
	db *gorm.DB
}

func NewTaxTemplateLineDAO(db *gorm.DB) TaxTemplateLineDAO {
	return taxTemplateLineDAO{Base: dao.NewBase[TaxTemplateLine](db), db: db}
}

func (d taxTemplateLineDAO) ListByProfile(ctx context.Context, profileID uint64) ([]*TaxTemplateLine, error) {
	var rows []TaxTemplateLine
	if err := d.db.WithContext(ctx).
		Where("profile_id = ?", profileID).
		Order("sequence ASC, id ASC").
		Find(&rows).Error; err != nil {
		return nil, err
	}
	items := make([]*TaxTemplateLine, len(rows))
	for i := range rows {
		items[i] = &rows[i]
	}
	return items, nil
}

func (d taxTemplateLineDAO) ReplaceForProfile(ctx context.Context, profileID uint64, lines []*TaxTemplateLine) error {
	return d.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Unscoped().Where("profile_id = ?", profileID).Delete(&TaxTemplateLine{}).Error; err != nil {
			return err
		}
		for _, line := range lines {
			line.ProfileID = profileID
			if err := tx.Create(line).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

type organizationLocalizer struct {
	organizations dao.Base[reference.Organization]
}

func NewOrganizationLocalizer(db *gorm.DB) OrganizationUpdater {
	return organizationLocalizer{organizations: dao.NewBase[reference.Organization](db)}
}

func (l organizationLocalizer) ApplyLocalization(ctx context.Context, organizationID uint64, countryCode, currencyCode, timezone string, taxYearStartMonth int16) error {
	organization, err := l.organizations.Find(ctx, organizationID)
	if err != nil {
		return dao.NotFound(err, ErrOrganizationNotFound)
	}
	if organization == nil {
		return ErrOrganizationNotFound
	}
	organization.CountryCode = helper.Ptr(countryCode)
	organization.BaseCurrency = currencyCode
	organization.Timezone = timezone
	organization.TaxYearStartMonth = taxYearStartMonth
	_, err = l.organizations.Update(ctx, organization)
	return err
}
