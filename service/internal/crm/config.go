package crm

import (
	"context"
	"strings"

	"github.com/jalusw/swantara/apps/service/internal/systemconfig"
)

const (
	configPromotionRequiredFields = "crm.promotion_required_fields"
	configLeadResponseSLAHours    = "crm.lead_response_sla_hours"
)

var defaultPromotionRequiredFields = []string{"contact", "need"}

const defaultLeadResponseSLAHours = 24

func (s ProspectService) promotionRequiredFields(ctx context.Context, organizationID uint64) ([]string, error) {
	if s.configs == nil {
		return defaultPromotionRequiredFields, nil
	}
	fields := append([]string(nil), defaultPromotionRequiredFields...)
	if err := systemconfig.Read(ctx, s.configs, organizationID, configPromotionRequiredFields, &fields); err != nil {
		return nil, err
	}
	return normalizePromotionFields(fields), nil
}

func (s PipelineService) leadResponseSLAHours(ctx context.Context, organizationID *uint64) (float64, error) {
	if s.configs == nil || organizationID == nil {
		return defaultLeadResponseSLAHours, nil
	}
	hours := float64(defaultLeadResponseSLAHours)
	if err := systemconfig.Read(ctx, s.configs, *organizationID, configLeadResponseSLAHours, &hours); err != nil {
		return 0, err
	}
	if hours <= 0 {
		hours = defaultLeadResponseSLAHours
	}
	return hours, nil
}

func normalizePromotionFields(fields []string) []string {
	seen := make(map[string]struct{}, len(fields))
	normalized := make([]string, 0, len(fields))
	for _, field := range fields {
		value := strings.ToLower(strings.TrimSpace(field))
		if value == "" {
			continue
		}
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		normalized = append(normalized, value)
	}
	return normalized
}
