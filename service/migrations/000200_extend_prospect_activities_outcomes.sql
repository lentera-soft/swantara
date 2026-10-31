-- +goose Up
SELECT 'up SQL query';
ALTER TABLE prospect_activities
  ADD COLUMN outcome TEXT,
  ADD COLUMN next_step TEXT,
  ADD COLUMN next_step_due DATE,
  ADD COLUMN participants TEXT;

ALTER TABLE prospect_activities
  ADD CONSTRAINT prospect_activities_outcome_check
  CHECK (outcome IS NULL OR outcome IN (
    'connected','no_answer','left_message','meeting_held','demo_done',
    'proposal_sent','follow_up','not_interested','other'
  ));

-- +goose Down
SELECT 'down SQL query';
ALTER TABLE prospect_activities DROP CONSTRAINT IF EXISTS prospect_activities_outcome_check;
ALTER TABLE prospect_activities
  DROP COLUMN participants,
  DROP COLUMN next_step_due,
  DROP COLUMN next_step,
  DROP COLUMN outcome;
