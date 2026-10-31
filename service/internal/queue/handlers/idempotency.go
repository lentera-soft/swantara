package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"

	"github.com/hibiken/asynq"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/jobs"
	"github.com/jalusw/swantara/apps/service/internal/kernel/clock"
	"github.com/jalusw/swantara/apps/service/internal/queue/tasks"
	"github.com/jalusw/swantara/apps/service/internal/xtradata"
)

type IdempotencyCleanupHandler struct {
	keys    xtradata.IdempotencyKeyDAO
	jobRuns jobs.Service
}

func NewIdempotencyCleanupHandler(keys xtradata.IdempotencyKeyDAO, jobRuns jobs.Service) IdempotencyCleanupHandler {
	return IdempotencyCleanupHandler{keys: keys, jobRuns: jobRuns}
}

func (h IdempotencyCleanupHandler) Handle(ctx context.Context, t *asynq.Task) (err error) {
	var payload tasks.IdempotencyCleanupPayload
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

	run, err := h.jobRuns.Start(ctx, jobs.TypeIdempotencyCleanup)
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

	removed, err := h.keys.PurgeExpired(ctx, clock.Now().UTC())
	if err != nil {
		return fmt.Errorf("failed to purge expired idempotency keys: %w", err)
	}

	if err := h.jobRuns.Complete(ctx, run, int(removed)); err != nil {
		return fmt.Errorf("failed to complete job run checkpoint: %w", err)
	}

	slog.Info("task completed", "task", t.Type(), "request_id", payload.RequestID, "removed", removed)

	return nil
}
