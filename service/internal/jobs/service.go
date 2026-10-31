package jobs

import (
	"context"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/kernel/clock"
)

type Service struct {
	runs JobRunDAO
	now  func() time.Time
}

func NewService(runs JobRunDAO) Service {
	return Service{runs: runs, now: clock.Now}
}

func (s Service) Start(ctx context.Context, jobType string) (*JobRun, error) {
	running, err := s.runs.HasRunning(ctx, jobType)
	if err != nil {
		return nil, err
	}
	if running {
		return nil, ErrJobRunning
	}
	return s.runs.Create(ctx, &JobRun{
		JobType:   jobType,
		Status:    StatusRunning,
		StartedAt: s.now().UTC(),
	})
}

func (s Service) Complete(ctx context.Context, run *JobRun, processed int) error {
	if run == nil {
		return ErrJobNotFound
	}
	finished := s.now().UTC()
	run.Status = StatusCompleted
	run.Processed = processed
	run.FinishedAt = &finished
	_, err := s.runs.Update(ctx, run)
	return err
}

func (s Service) Fail(ctx context.Context, run *JobRun, message string) error {
	if run == nil {
		return ErrJobNotFound
	}
	finished := s.now().UTC()
	run.Status = StatusFailed
	run.FinishedAt = &finished
	run.ErrorMessage = &message
	_, err := s.runs.Update(ctx, run)
	return err
}
