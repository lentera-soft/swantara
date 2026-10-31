-- +goose Up
SELECT 'up SQL query';
CREATE TABLE prospect_stage_histories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  prospect_id BIGINT NOT NULL,
  from_stage_id BIGINT,
  to_stage_id BIGINT,
  from_status TEXT,
  to_status TEXT,
  probability NUMERIC(5,2),
  notes TEXT,
  actor_id BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT fk_prospect_stage_histories_prospect_id
    FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE,
  CONSTRAINT fk_prospect_stage_histories_from_stage_id
    FOREIGN KEY (from_stage_id) REFERENCES pipeline_stages(id) ON DELETE SET NULL,
  CONSTRAINT fk_prospect_stage_histories_to_stage_id
    FOREIGN KEY (to_stage_id) REFERENCES pipeline_stages(id) ON DELETE SET NULL,
  CONSTRAINT fk_prospect_stage_histories_actor_id
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_prospect_stage_histories_prospect_id
  ON prospect_stage_histories(prospect_id, created_at);

-- +goose Down
SELECT 'down SQL query';
DROP TABLE prospect_stage_histories;
