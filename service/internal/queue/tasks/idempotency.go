package tasks

import "github.com/hibiken/asynq"

const TypeIdempotencyCleanup = "idempotency-cleanup-daily"

type IdempotencyCleanupPayload struct {
	RequestID string `json:"request_id,omitempty"`
}

func NewIdempotencyCleanupTask(requestID string) (*asynq.Task, error) {
	return newTask(TypeIdempotencyCleanup, IdempotencyCleanupPayload{RequestID: requestID})
}
