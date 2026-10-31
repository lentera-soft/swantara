package tasks

import "github.com/hibiken/asynq"

const TypeGiftCardForfeit = "gift-card-forfeit-daily"

type GiftCardForfeitPayload struct {
	RequestID string `json:"request_id,omitempty"`
}

func NewGiftCardForfeitTask(requestID string) (*asynq.Task, error) {
	return newTask(TypeGiftCardForfeit, GiftCardForfeitPayload{RequestID: requestID})
}
