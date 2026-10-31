package reference

import (
	"context"
	"strings"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/scope"
)

type CampaignService struct {
	orgCRUD[Campaign]
}

func NewCampaignService(campaigns dao.Base[Campaign]) CampaignService {
	return CampaignService{
		orgCRUD: newOrgCRUD(campaigns, func(campaign *Campaign, organizationID uint64) bool {
			return scope.Owns(campaign.OrganizationID, organizationID)
		}, ErrCampaignNotFound),
	}
}

func (s CampaignService) Create(ctx context.Context, campaign *Campaign) (*Campaign, error) {
	if err := s.validate(campaign); err != nil {
		return nil, err
	}
	if campaign.Status == "" {
		campaign.Status = "planned"
	}
	return s.base.Create(ctx, campaign)
}

func (s CampaignService) Update(ctx context.Context, organizationID uint64, campaign *Campaign) (*Campaign, error) {
	existing, err := s.base.Find(ctx, campaign.ID)
	if err != nil {
		return nil, dao.NotFound(err, ErrCampaignNotFound)
	}
	if existing == nil || !scope.Owns(existing.OrganizationID, organizationID) {
		return nil, ErrCampaignNotFound
	}
	campaign.OrganizationID = existing.OrganizationID
	if err := s.validate(campaign); err != nil {
		return nil, err
	}
	if campaign.Status == "" {
		campaign.Status = existing.Status
	}
	return s.base.Update(ctx, campaign)
}

func (s CampaignService) validate(campaign *Campaign) error {
	if strings.TrimSpace(campaign.Name) == "" {
		return ErrCampaignName
	}
	return nil
}
