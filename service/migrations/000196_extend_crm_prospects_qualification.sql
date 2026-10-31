-- +goose Up
SELECT 'up SQL query';
ALTER TABLE prospects
  ADD COLUMN status TEXT NOT NULL DEFAULT 'new',
  ADD COLUMN temperature TEXT NOT NULL DEFAULT 'warm',
  ADD COLUMN need_summary TEXT,
  ADD COLUMN budget_amount NUMERIC(18,4),
  ADD COLUMN budget_confirmed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN authority_confirmed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN timeline_date DATE,
  ADD COLUMN fit_score SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN intent_score SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN lead_score SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN qualification_notes TEXT,
  ADD COLUMN decision_criteria TEXT,
  ADD COLUMN competition TEXT,
  ADD COLUMN proposed_solution TEXT,
  ADD COLUMN next_step TEXT,
  ADD COLUMN next_step_due DATE,
  ADD COLUMN forecast_category TEXT NOT NULL DEFAULT 'pipeline',
  ADD COLUMN currency_code TEXT NOT NULL DEFAULT 'IDR',
  ADD COLUMN consent_granted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN consent_source TEXT,
  ADD COLUMN consent_at TIMESTAMP,
  ADD COLUMN do_not_contact BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN first_contacted_at TIMESTAMP,
  ADD COLUMN qualified_at TIMESTAMP,
  ADD COLUMN converted_at TIMESTAMP,
  ADD COLUMN stage_entered_at TIMESTAMP,
  ADD COLUMN last_activity_at TIMESTAMP,
  ADD COLUMN owner_user_id BIGINT,
  ADD COLUMN lost_reason_code TEXT;

ALTER TABLE prospects
  ADD CONSTRAINT prospects_status_check
  CHECK (status IN ('new','contacted','qualified','nurtured','disqualified','converted','won','lost'));

ALTER TABLE prospects
  ADD CONSTRAINT prospects_temperature_check
  CHECK (temperature IN ('cold','warm','hot','referral','existing'));

ALTER TABLE prospects
  ADD CONSTRAINT prospects_forecast_category_check
  CHECK (forecast_category IN ('pipeline','best_case','commit'));

ALTER TABLE prospects
  ADD CONSTRAINT prospects_fit_score_check CHECK (fit_score BETWEEN 0 AND 100);

ALTER TABLE prospects
  ADD CONSTRAINT prospects_intent_score_check CHECK (intent_score BETWEEN 0 AND 100);

ALTER TABLE prospects
  ADD CONSTRAINT prospects_lead_score_check CHECK (lead_score BETWEEN 0 AND 100);

ALTER TABLE prospects
  ADD CONSTRAINT fk_prospects_owner_user_id
  FOREIGN KEY (owner_user_id) REFERENCES users(id)
  ON DELETE RESTRICT
  ON UPDATE NO ACTION;

UPDATE prospects
SET status = CASE
    WHEN type = 'opportunity' THEN 'qualified'
    ELSE 'new'
  END,
  qualified_at = CASE
    WHEN type = 'opportunity' THEN COALESCE(updated_at, created_at)
    ELSE NULL
  END,
  converted_at = CASE
    WHEN type = 'opportunity' THEN COALESCE(updated_at, created_at)
    ELSE NULL
  END,
  stage_entered_at = CASE
    WHEN type = 'opportunity' THEN COALESCE(updated_at, created_at)
    ELSE NULL
  END;

CREATE INDEX idx_prospects_status ON prospects(organization_id, status);
CREATE INDEX idx_prospects_temperature ON prospects(organization_id, temperature);
CREATE INDEX idx_prospects_owner_user_id ON prospects(owner_user_id);
CREATE INDEX idx_prospects_duplicate_email ON prospects(organization_id, lower(email));
CREATE INDEX idx_prospects_duplicate_phone ON prospects(organization_id, phone);

-- +goose Down
SELECT 'down SQL query';
DROP INDEX IF EXISTS idx_prospects_duplicate_phone;
DROP INDEX IF EXISTS idx_prospects_duplicate_email;
DROP INDEX IF EXISTS idx_prospects_owner_user_id;
DROP INDEX IF EXISTS idx_prospects_temperature;
DROP INDEX IF EXISTS idx_prospects_status;
ALTER TABLE prospects DROP CONSTRAINT IF EXISTS fk_prospects_owner_user_id;
ALTER TABLE prospects DROP CONSTRAINT IF EXISTS prospects_lead_score_check;
ALTER TABLE prospects DROP CONSTRAINT IF EXISTS prospects_intent_score_check;
ALTER TABLE prospects DROP CONSTRAINT IF EXISTS prospects_fit_score_check;
ALTER TABLE prospects DROP CONSTRAINT IF EXISTS prospects_forecast_category_check;
ALTER TABLE prospects DROP CONSTRAINT IF EXISTS prospects_temperature_check;
ALTER TABLE prospects DROP CONSTRAINT IF EXISTS prospects_status_check;
ALTER TABLE prospects
  DROP COLUMN lost_reason_code,
  DROP COLUMN owner_user_id,
  DROP COLUMN last_activity_at,
  DROP COLUMN stage_entered_at,
  DROP COLUMN converted_at,
  DROP COLUMN qualified_at,
  DROP COLUMN first_contacted_at,
  DROP COLUMN do_not_contact,
  DROP COLUMN consent_at,
  DROP COLUMN consent_source,
  DROP COLUMN consent_granted,
  DROP COLUMN currency_code,
  DROP COLUMN forecast_category,
  DROP COLUMN next_step_due,
  DROP COLUMN next_step,
  DROP COLUMN proposed_solution,
  DROP COLUMN competition,
  DROP COLUMN decision_criteria,
  DROP COLUMN qualification_notes,
  DROP COLUMN lead_score,
  DROP COLUMN intent_score,
  DROP COLUMN fit_score,
  DROP COLUMN timeline_date,
  DROP COLUMN authority_confirmed,
  DROP COLUMN budget_confirmed,
  DROP COLUMN budget_amount,
  DROP COLUMN need_summary,
  DROP COLUMN temperature,
  DROP COLUMN status;
