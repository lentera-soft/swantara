package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"

	"github.com/hibiken/asynq"
	"github.com/jalusw/swantara/apps/service/internal/giftcard"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/jobs"
	"github.com/jalusw/swantara/apps/service/internal/queue/tasks"
	"github.com/jalusw/swantara/apps/service/internal/xtradata"

	"github.com/jalusw/swantara/apps/service/internal/kernel/clock"
)

type GiftCardForfeitHandler struct {
	giftCards giftcard.GiftCardService
	cards     giftcard.GiftCardDAO
	forfeit   giftcard.ForfeitConfig
	jobRuns   jobs.Service
	events    xtradata.EventService
}

func NewGiftCardForfeitHandler(giftCards giftcard.GiftCardService, cards giftcard.GiftCardDAO, forfeit giftcard.ForfeitConfig, jobRuns jobs.Service, events xtradata.EventService) GiftCardForfeitHandler {
	return GiftCardForfeitHandler{giftCards: giftCards, cards: cards, forfeit: forfeit, jobRuns: jobRuns, events: events}
}

func (h GiftCardForfeitHandler) Handle(ctx context.Context, t *asynq.Task) (err error) {
	var payload tasks.GiftCardForfeitPayload

	if err = json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	ctx = helper.ContextWithRequestID(ctx, payload.RequestID)

	defer func() {
		if err != nil {
			slog.Error("task failed", "task", t.Type(), "request_id", payload.RequestID, "error", err)
		}
	}()

	slog.Info("task started", "task", t.Type(), "request_id", payload.RequestID)

	run, err := h.jobRuns.Start(ctx, jobs.TypeGiftCardForfeit)
	if err != nil {
		if errors.Is(err, jobs.ErrJobRunning) {
			slog.Info("skipping task, a previous run is still in progress", "task", t.Type(), "request_id", payload.RequestID)
			return nil
		}
		return fmt.Errorf("failed to start job run checkpoint: %w", err)
	}
	defer func() {
		if err != nil {
			_ = h.jobRuns.Fail(ctx, run, err.Error())
		}
	}()

	asOf := clock.Now().UTC()
	organizationIDs, err := h.cards.ListOrganizationIDsDueForExpiry(ctx, asOf)
	if err != nil {
		return fmt.Errorf("failed to list organizations with expired gift cards: %w", err)
	}

	forfeited := 0
	skipped := 0
	for _, organizationID := range organizationIDs {
		journalID, liabilityID, incomeID, configured, configErr := h.forfeitAccounts(ctx, organizationID)
		if configErr != nil {
			return fmt.Errorf("failed to read gift card configuration for organization %d: %w", organizationID, configErr)
		}
		if !configured {
			slog.Info("skipping gift card forfeiture, organization is not configured", "organization_id", organizationID, "request_id", payload.RequestID)
			skipped++
			continue
		}
		cards, err := h.giftCards.ForfeitExpired(ctx, giftcard.ForfeitExpiredRequest{
			OrganizationID:     organizationID,
			AsOf:               asOf,
			Date:               asOf,
			JournalID:          journalID,
			LiabilityAccountID: liabilityID,
			IncomeAccountID:    incomeID,
		})
		if err != nil {
			return fmt.Errorf("failed to forfeit expired gift cards for organization %d: %w", organizationID, err)
		}
		forfeited += len(cards)
	}

	if err := h.jobRuns.Complete(ctx, run, forfeited); err != nil {
		return fmt.Errorf("failed to complete job run checkpoint: %w", err)
	}

	publishRunEvent(ctx, h.events, "giftcard.forfeit.completed", map[string]any{
		"forfeited": forfeited,
		"skipped":   skipped,
		"as_of":     asOf,
	})

	slog.Info("task completed", "task", t.Type(), "request_id", payload.RequestID, "forfeited", forfeited, "skipped", skipped)

	return nil
}

func (h GiftCardForfeitHandler) forfeitAccounts(ctx context.Context, organizationID uint64) (journalID, liabilityID, incomeID uint64, configured bool, err error) {
	journalID, err = h.forfeit.JournalID(ctx, organizationID)
	if err != nil {
		return 0, 0, 0, false, err
	}
	liabilityID, err = h.forfeit.LiabilityAccountID(ctx, organizationID)
	if err != nil {
		return 0, 0, 0, false, err
	}
	incomeID, err = h.forfeit.IncomeAccountID(ctx, organizationID)
	if err != nil {
		return 0, 0, 0, false, err
	}
	return journalID, liabilityID, incomeID, journalID != 0 && liabilityID != 0 && incomeID != 0, nil
}
