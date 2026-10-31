package sales

import (
	"context"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"gorm.io/gorm"
)

type SaleQuoteDAO interface {
	dao.CRUD[SaleQuote]
	CreateWithLines(ctx context.Context, quote *SaleQuote, lines []*SaleQuoteLine) (*SaleQuote, error)
	ListHistory(ctx context.Context, quoteID uint64) ([]*SaleQuote, error)
}

type saleQuoteDAO struct {
	dao.Base[SaleQuote]
	db *gorm.DB
}

func NewSaleQuoteDAO(db *gorm.DB) SaleQuoteDAO {
	return saleQuoteDAO{Base: dao.NewBase[SaleQuote](db), db: db}
}

func (d saleQuoteDAO) CreateWithLines(ctx context.Context, quote *SaleQuote, lines []*SaleQuoteLine) (*SaleQuote, error) {
	err := d.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(quote).Error; err != nil {
			return err
		}
		for _, line := range lines {
			line.QuoteID = quote.ID
			if err := tx.Create(line).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return quote, nil
}

func (d saleQuoteDAO) ListHistory(ctx context.Context, quoteID uint64) ([]*SaleQuote, error) {
	var quotes []SaleQuote
	err := d.db.WithContext(ctx).
		Where("id = ? OR root_quote_id = ?", quoteID, quoteID).
		Order("version ASC").
		Find(&quotes).Error
	if err != nil {
		return nil, err
	}
	items := make([]*SaleQuote, len(quotes))
	for i := range quotes {
		items[i] = &quotes[i]
	}
	return items, nil
}

type SaleQuoteLineDAO interface {
	dao.CRUD[SaleQuoteLine]
	ListByQuote(ctx context.Context, quoteID uint64) ([]*SaleQuoteLine, error)
	ReplaceLines(ctx context.Context, quoteID uint64, lines []*SaleQuoteLine) error
}

type saleQuoteLineDAO struct {
	dao.Base[SaleQuoteLine]
	db *gorm.DB
}

func NewSaleQuoteLineDAO(db *gorm.DB) SaleQuoteLineDAO {
	return saleQuoteLineDAO{Base: dao.NewBase[SaleQuoteLine](db), db: db}
}

func (d saleQuoteLineDAO) ListByQuote(ctx context.Context, quoteID uint64) ([]*SaleQuoteLine, error) {
	page, err := d.List(ctx, &query.Query{Filters: []query.Filter{{Field: "quote_id", Operator: query.Equal, Value: quoteID}}})
	if err != nil {
		return nil, err
	}
	return page.Items, nil
}

func (d saleQuoteLineDAO) ReplaceLines(ctx context.Context, quoteID uint64, lines []*SaleQuoteLine) error {
	return d.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Unscoped().Where("quote_id = ?", quoteID).Delete(&SaleQuoteLine{}).Error; err != nil {
			return err
		}
		for _, line := range lines {
			line.QuoteID = quoteID
			line.ID = 0
			if err := tx.Create(line).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
