//go:build test

package localization

import (
	"strings"
	"time"

	"github.com/brianvoe/gofakeit/v7"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
)

func ProfileFixture(opts ...func(*Profile) *Profile) *Profile {
	now := time.Now()
	profile := &Profile{
		Base:              model.Base{ID: uint64(gofakeit.Number(1, 10000)), CreatedAt: now, UpdatedAt: now},
		Name:              gofakeit.Country(),
		CountryCode:       strings.ToUpper(gofakeit.CountryAbr()),
		CurrencyCode:      strings.ToUpper(gofakeit.CurrencyShort()),
		Locale:            "id-ID",
		Timezone:          "Asia/Jakarta",
		DateFormat:        "DD/MM/YYYY",
		TaxYearStartMonth: int16(gofakeit.Number(1, 12)),
		Active:            true,
	}
	for _, opt := range opts {
		opt(profile)
	}
	return profile
}

func TaxTemplateLineFixture(opts ...func(*TaxTemplateLine) *TaxTemplateLine) *TaxTemplateLine {
	now := time.Now()
	line := &TaxTemplateLine{
		Base:           model.Base{ID: uint64(gofakeit.Number(1, 10000)), CreatedAt: now, UpdatedAt: now},
		ProfileID:      uint64(gofakeit.Number(1, 10000)),
		Name:           "VAT " + gofakeit.DigitN(2) + "%",
		Kind:           TaxKindSale,
		Rate:           gofakeit.Float64Range(0, 30),
		PriceInclude:   gofakeit.Bool(),
		TaxAccountCode: gofakeit.LetterN(4),
		Sequence:       gofakeit.Number(1, 100),
	}
	for _, opt := range opts {
		opt(line)
	}
	return line
}
