-- +goose Up
SELECT 'up SQL query';
ALTER TABLE pipeline_stages
  ADD COLUMN is_lost BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN exit_criteria TEXT;

ALTER TABLE pipeline_stages
  ADD CONSTRAINT pipeline_stages_not_won_and_lost
  CHECK (NOT (is_won AND is_lost));

-- +goose Down
SELECT 'down SQL query';
ALTER TABLE pipeline_stages DROP CONSTRAINT IF EXISTS pipeline_stages_not_won_and_lost;
ALTER TABLE pipeline_stages
  DROP COLUMN exit_criteria,
  DROP COLUMN is_lost;
