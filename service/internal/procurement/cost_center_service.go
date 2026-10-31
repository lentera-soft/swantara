package procurement

import (
	"context"

	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
)

type CostCenterService struct {
	centers CostCenterDAO
}

func NewCostCenterService(centers CostCenterDAO) CostCenterService {
	return CostCenterService{centers: centers}
}

func (s CostCenterService) ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[CostCenter], error) {
	return s.centers.ListInOrg(ctx, q, organizationID)
}

func (s CostCenterService) FindInOrg(ctx context.Context, id, organizationID uint64) (*CostCenter, error) {
	return s.centers.FindInOrg(ctx, id, organizationID)
}

func (s CostCenterService) Create(ctx context.Context, center *CostCenter) (*CostCenter, error) {
	return s.centers.Create(ctx, center)
}

func (s CostCenterService) Update(ctx context.Context, center *CostCenter) (*CostCenter, error) {
	return s.centers.Update(ctx, center)
}

func (s CostCenterService) Delete(ctx context.Context, id uint64) error {
	return s.centers.Delete(ctx, id)
}
