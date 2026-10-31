package seeders

import (
	"context"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type CountrySeed struct {
	Countries []CountrySeedItem `json:"countries"`
}

type CountrySeedItem struct {
	Code         string `json:"code"`
	Name         string `json:"name"`
	CurrencyCode string `json:"currency_code"`
	Timezone     string `json:"timezone"`
}

func LoadCountrySeed() (*CountrySeed, error) {
	return loadSeedData[CountrySeed]("data/countries.json")
}

func (s *Seeder) seedCountries(ctx context.Context) error {
	seed, err := LoadCountrySeed()
	if err != nil {
		return err
	}

	countries := make([]*reference.Country, 0, len(seed.Countries))
	for _, item := range seed.Countries {
		countries = append(countries, &reference.Country{
			Code:         item.Code,
			Name:         item.Name,
			CurrencyCode: item.CurrencyCode,
			Timezone:     item.Timezone,
		})
	}

	countryDAO := dao.NewBase[reference.Country](s.db)
	_, err = seedMissing(ctx, countryDAO, "code", nil, countries, func(c *reference.Country) any { return c.Code })
	return err
}
