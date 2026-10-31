package localization

import "github.com/jalusw/swantara/apps/service/internal/kernel/model"

const (
	TaxKindSale     = "sale"
	TaxKindPurchase = "purchase"
)

type Profile struct {
	model.Base
	Name              string `json:"name"`
	CountryCode       string `gorm:"type:char(2);not null" json:"country_code"`
	CurrencyCode      string `gorm:"type:char(3);not null" json:"currency_code"`
	Locale            string `gorm:"default:id-ID" json:"locale"`
	Timezone          string `gorm:"default:UTC" json:"timezone"`
	DateFormat        string `gorm:"default:DD/MM/YYYY" json:"date_format"`
	TaxYearStartMonth int16  `gorm:"default:1" json:"tax_year_start_month"`
	Active            bool   `gorm:"default:true" json:"active"`
}

func (Profile) TableName() string {
	return "localization_profiles"
}

type TaxTemplateLine struct {
	model.Base
	ProfileID      uint64  `gorm:"not null;index" json:"profile_id"`
	Name           string  `json:"name"`
	Kind           string  `gorm:"type:text" json:"kind"`
	Rate           float64 `gorm:"type:numeric(8,4);default:0" json:"rate"`
	PriceInclude   bool    `json:"price_include"`
	TaxAccountCode string  `json:"tax_account_code"`
	Sequence       int     `gorm:"default:0" json:"sequence"`
}

func (TaxTemplateLine) TableName() string {
	return "localization_tax_template_lines"
}
