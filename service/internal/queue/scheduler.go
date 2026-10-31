package queue

import (
	"github.com/hibiken/asynq"
	"github.com/jalusw/swantara/apps/service/internal/config"
	"github.com/jalusw/swantara/apps/service/internal/queue/tasks"

	"github.com/jalusw/swantara/apps/service/internal/logger"
)

// Default periodic cron schedules (UTC) for recurring housekeeping jobs.
const (
	CronSubscriptionBilling = "0 2 * * *"
	CronDeferralRecognition = "0 2 * * *"
	CronGiftCardForfeit     = "30 2 * * *"
	CronIdempotencyCleanup  = "0 3 * * *"
)

func NewPeriodicScheduler(config *config.Config) *asynq.Scheduler {
	scheduler := asynq.NewScheduler(redisClientOpt(config), nil)
	registerPeriodic(scheduler, CronSubscriptionBilling, func() (*asynq.Task, error) {
		return tasks.NewSubscriptionBillingTask("")
	})
	registerPeriodic(scheduler, CronDeferralRecognition, func() (*asynq.Task, error) {
		return tasks.NewDeferralRecognitionTask("")
	})
	registerPeriodic(scheduler, CronGiftCardForfeit, func() (*asynq.Task, error) {
		return tasks.NewGiftCardForfeitTask("")
	})
	registerPeriodic(scheduler, CronIdempotencyCleanup, func() (*asynq.Task, error) {
		return tasks.NewIdempotencyCleanupTask("")
	})
	return scheduler
}

func registerPeriodic(scheduler *asynq.Scheduler, cronspec string, factory func() (*asynq.Task, error)) {
	task, err := factory()
	if err != nil {
		logger.Fatalf("Failed to build periodic task %v", err)
	}
	if _, err := scheduler.Register(cronspec, task); err != nil {
		logger.Fatalf("Failed to register periodic task %v", err)
	}
}
