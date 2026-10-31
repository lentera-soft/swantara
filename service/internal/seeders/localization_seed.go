package seeders

import (
	"context"

	"github.com/jalusw/swantara/apps/service/internal/localization"
)

type localizationSeed struct {
	Profiles []localizationProfileSeed `json:"profiles"`
}

type localizationProfileSeed struct {
	Name              string                    `json:"name"`
	CountryCode       string                    `json:"country_code"`
	CurrencyCode      string                    `json:"currency_code"`
	Locale            string                    `json:"locale"`
	Timezone          string                    `json:"timezone"`
	DateFormat        string                    `json:"date_format"`
	TaxYearStartMonth int16                     `json:"tax_year_start_month"`
	TaxTemplateLines  []localizationTaxLineSeed `json:"tax_template_lines"`
}

type localizationTaxLineSeed struct {
	Name           string  `json:"name"`
	Kind           string  `json:"kind"`
	Rate           float64 `json:"rate"`
	PriceInclude   bool    `json:"price_include"`
	TaxAccountCode string  `json:"tax_account_code"`
	Sequence       int     `json:"sequence"`
}

func loadLocalizationSeed() (*localizationSeed, error) {
	return loadSeedData[localizationSeed]("data/localization_seed.json")
}

func (s *Seeder) SeedLocalization(ctx context.Context) error {
	seed, err := loadLocalizationSeed()
	if err != nil {
		return err
	}
	profileDAO := localization.NewProfileDAO(s.db)
	lineDAO := localization.NewTaxTemplateLineDAO(s.db)

	for _, def := range seed.Profiles {
		existing, err := profileDAO.Search(ctx, "country_code", def.CountryCode)
		if err != nil {
			return err
		}
		profile := existing
		if profile == nil {
			created, err := profileDAO.Create(ctx, &localization.Profile{
				Name:              def.Name,
				CountryCode:       def.CountryCode,
				CurrencyCode:      def.CurrencyCode,
				Locale:            def.Locale,
				Timezone:          def.Timezone,
				DateFormat:        def.DateFormat,
				TaxYearStartMonth: def.TaxYearStartMonth,
				Active:            true,
			})
			if err != nil {
				return err
			}
			profile = created
		}

		lines, err := lineDAO.ListByProfile(ctx, profile.ID)
		if err != nil {
			return err
		}
		if len(lines) > 0 {
			continue
		}
		replacements := make([]*localization.TaxTemplateLine, 0, len(def.TaxTemplateLines))
		for _, line := range def.TaxTemplateLines {
			replacements = append(replacements, &localization.TaxTemplateLine{
				Name:           line.Name,
				Kind:           line.Kind,
				Rate:           line.Rate,
				PriceInclude:   line.PriceInclude,
				TaxAccountCode: line.TaxAccountCode,
				Sequence:       line.Sequence,
			})
		}
		if err := lineDAO.ReplaceForProfile(ctx, profile.ID, replacements); err != nil {
			return err
		}
	}
	return nil
}
