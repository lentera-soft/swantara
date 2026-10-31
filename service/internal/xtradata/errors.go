package xtradata

import "errors"

var (
	ErrEventNotFound              = errors.New("integration event not found")
	ErrConfigKeyExists            = errors.New("system config key already exists")
	ErrEventAlreadySent           = errors.New("integration event already sent")
	ErrIdempotencySave            = errors.New("failed to store idempotency key")
	ErrWebhookURLRequired         = errors.New("webhook url is required")
	ErrWebhookSubscriptionMissing = errors.New("webhook subscription not found")
)
