package giftcard

import (
	"context"

	"github.com/jalusw/swantara/apps/service/internal/systemconfig"
)

const (
	configGiftCardJournalID          = "giftcard.journal_id"
	configGiftCardLiabilityAccountID = "giftcard.liability_account_id"
	configGiftCardIncomeAccountID    = "giftcard.income_account_id"
)

type ForfeitConfig interface {
	JournalID(ctx context.Context, organizationID uint64) (uint64, error)
	LiabilityAccountID(ctx context.Context, organizationID uint64) (uint64, error)
	IncomeAccountID(ctx context.Context, organizationID uint64) (uint64, error)
}

type forfeitConfigSource struct {
	configs systemconfig.Lookup
}

func NewForfeitConfigSource(configs systemconfig.Lookup) ForfeitConfig {
	return forfeitConfigSource{configs: configs}
}

func (s forfeitConfigSource) JournalID(ctx context.Context, organizationID uint64) (uint64, error) {
	var value uint64
	if err := systemconfig.Read(ctx, s.configs, organizationID, configGiftCardJournalID, &value); err != nil {
		return 0, err
	}
	return value, nil
}

func (s forfeitConfigSource) LiabilityAccountID(ctx context.Context, organizationID uint64) (uint64, error) {
	var value uint64
	if err := systemconfig.Read(ctx, s.configs, organizationID, configGiftCardLiabilityAccountID, &value); err != nil {
		return 0, err
	}
	return value, nil
}

func (s forfeitConfigSource) IncomeAccountID(ctx context.Context, organizationID uint64) (uint64, error) {
	var value uint64
	if err := systemconfig.Read(ctx, s.configs, organizationID, configGiftCardIncomeAccountID, &value); err != nil {
		return 0, err
	}
	return value, nil
}
