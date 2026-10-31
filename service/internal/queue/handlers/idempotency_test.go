package handlers

import (
	"context"
	"testing"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/jobs"
	"github.com/jalusw/swantara/apps/service/internal/queue/tasks"
	"github.com/jalusw/swantara/apps/service/internal/xtradata"
)

func TestIdempotencyCleanupHandler_PurgesExpired(t *testing.T) {
	purged := false
	processed := -1
	keys := xtradata.IdempotencyKeyDAOMock{
		PurgeExpiredFn: func(_ context.Context, now time.Time) (int64, error) {
			purged = true
			if now.IsZero() {
				t.Error("purge time is zero")
			}
			return 5, nil
		},
	}
	jobRuns := testJobService(nil, func(_ context.Context, run *jobs.JobRun) (*jobs.JobRun, error) {
		processed = run.Processed
		return run, nil
	})

	handler := NewIdempotencyCleanupHandler(keys, jobRuns)
	err := handler.Handle(context.Background(), asynqTask(t, tasks.TypeIdempotencyCleanup, tasks.IdempotencyCleanupPayload{RequestID: "req-cleanup"}))
	if err != nil {
		t.Fatalf("Handle() error = %v", err)
	}
	if !purged {
		t.Error("PurgeExpired was not called")
	}
	if processed != 5 {
		t.Errorf("processed = %d, want 5", processed)
	}
}
