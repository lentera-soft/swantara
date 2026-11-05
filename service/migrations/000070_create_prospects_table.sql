-- +goose Up
SELECT 'up SQL query';
CREATE TABLE prospects (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id BIGINT,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('prospect','opportunity')),
  contact_id BIGINT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  job_position TEXT,
  stage_id BIGINT,
  expected_revenue NUMERIC(18,4),
  probability NUMERIC(5,2),
  priority SMALLINT DEFAULT 0,
  salesperson_id BIGINT,
  sales_group_id BIGINT,
  source TEXT,
  medium TEXT,
  campaign TEXT,
  lost_reason TEXT,
  expected_close DATE,
  closed_at TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'new',
  temperature TEXT NOT NULL DEFAULT 'warm',
  need_summary TEXT,
  budget_amount NUMERIC(18,4),
  budget_confirmed BOOLEAN NOT NULL DEFAULT false,
  authority_confirmed BOOLEAN NOT NULL DEFAULT false,
  timeline_date DATE,
  fit_score SMALLINT NOT NULL DEFAULT 0,
  intent_score SMALLINT NOT NULL DEFAULT 0,
  lead_score SMALLINT NOT NULL DEFAULT 0,
  qualification_notes TEXT,
  decision_criteria TEXT,
  competition TEXT,
  proposed_solution TEXT,
  next_step TEXT,
  next_step_due DATE,
  forecast_category TEXT NOT NULL DEFAULT 'pipeline',
  currency_code TEXT NOT NULL DEFAULT 'IDR',
  consent_granted BOOLEAN NOT NULL DEFAULT false,
  consent_source TEXT,
  consent_at TIMESTAMP,
  do_not_contact BOOLEAN NOT NULL DEFAULT false,
  first_contacted_at TIMESTAMP,
  qualified_at TIMESTAMP,
  converted_at TIMESTAMP,
  stage_entered_at TIMESTAMP,
  last_activity_at TIMESTAMP,
  owner_user_id BIGINT,
  lost_reason_code TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT fk_prospects_organization_id
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_prospects_contact_id
    FOREIGN KEY (contact_id)
    REFERENCES contacts(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_prospects_stage_id
    FOREIGN KEY (stage_id)
    REFERENCES pipeline_stages(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_prospects_salesperson_id
    FOREIGN KEY (salesperson_id)
    REFERENCES contacts(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_prospects_sales_group_id
    FOREIGN KEY (sales_group_id)
    REFERENCES sales_groups(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT prospects_status_check
    CHECK (status IN ('new','contacted','qualified','nurtured','disqualified','converted','won','lost')),
  CONSTRAINT prospects_temperature_check
    CHECK (temperature IN ('cold','warm','hot','referral','existing')),
  CONSTRAINT prospects_forecast_category_check
    CHECK (forecast_category IN ('pipeline','best_case','commit')),
  CONSTRAINT prospects_fit_score_check CHECK (fit_score BETWEEN 0 AND 100),
  CONSTRAINT prospects_intent_score_check CHECK (intent_score BETWEEN 0 AND 100),
  CONSTRAINT prospects_lead_score_check CHECK (lead_score BETWEEN 0 AND 100),
  CONSTRAINT fk_prospects_owner_user_id
    FOREIGN KEY (owner_user_id)
    REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION
);

CREATE INDEX idx_prospects_status ON prospects(organization_id, status);
CREATE INDEX idx_prospects_temperature ON prospects(organization_id, temperature);
CREATE INDEX idx_prospects_owner_user_id ON prospects(owner_user_id);
CREATE INDEX idx_prospects_duplicate_email ON prospects(organization_id, lower(email));
CREATE INDEX idx_prospects_duplicate_phone ON prospects(organization_id, phone);

-- +goose Down
SELECT 'down SQL query';
DROP TABLE prospects;
