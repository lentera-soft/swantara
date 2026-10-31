package reference

import (
	"context"
	"strings"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/scope"
)

type CarrierService struct {
	orgCRUD[Carrier]
	variants VariantExistenceChecker
}

func NewCarrierService(carriers dao.Base[Carrier], variants VariantExistenceChecker) CarrierService {
	return CarrierService{
		orgCRUD: newOrgCRUD(carriers, func(carrier *Carrier, organizationID uint64) bool {
			return scope.Owns(carrier.OrganizationID, organizationID)
		}, ErrCarrierNotFound),
		variants: variants,
	}
}

func (s CarrierService) Create(ctx context.Context, carrier *Carrier) (*Carrier, error) {
	if err := s.validate(ctx, carrier); err != nil {
		return nil, err
	}
	return s.base.Create(ctx, carrier)
}

func (s CarrierService) Update(ctx context.Context, organizationID uint64, carrier *Carrier) (*Carrier, error) {
	existing, err := s.base.Find(ctx, carrier.ID)
	if err != nil {
		return nil, dao.NotFound(err, ErrCarrierNotFound)
	}
	if existing == nil || !scope.Owns(existing.OrganizationID, organizationID) {
		return nil, ErrCarrierNotFound
	}
	carrier.OrganizationID = existing.OrganizationID
	if err := s.validate(ctx, carrier); err != nil {
		return nil, err
	}
	return s.base.Update(ctx, carrier)
}

func (s CarrierService) validate(ctx context.Context, carrier *Carrier) error {
	if strings.TrimSpace(carrier.Name) == "" {
		return ErrCarrierName
	}
	if carrier.DeliveryItemID != nil {
		if s.variants == nil {
			return nil
		}
		exists, err := s.variants.VariantExists(ctx, *carrier.DeliveryItemID)
		if err != nil {
			return err
		}
		if !exists {
			return ErrCarrierDeliveryProduct
		}
	}
	return nil
}
