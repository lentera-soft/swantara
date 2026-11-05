-- +goose Up
SELECT 'up SQL query';
CREATE TABLE prospect_activities (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lead_id BIGINT,
  contact_id BIGINT,
  type TEXT,
  summary TEXT,
  note TEXT,
  due_date TIMESTAMP,
  done BOOLEAN DEFAULT false,
  done_at TIMESTAMP,
  user_id BIGINT,
  outcome TEXT,
  next_step TEXT,
  next_step_due DATE,
  participants TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT fk_prospect_activities_lead_id
    FOREIGN KEY (lead_id)
    REFERENCES prospects(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_prospect_activities_contact_id
    FOREIGN KEY (contact_id)
    REFERENCES contacts(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_prospect_activities_user_id
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT prospect_activities_outcome_check
    CHECK (outcome IS NULL OR outcome IN (
      'connected','no_answer','left_message','meeting_held','demo_done',
      'proposal_sent','follow_up','not_interested','other'
    ))
);

-- +goose Down
SELECT 'down SQL query';
DROP TABLE prospect_activities;
