-- +goose Up
SELECT 'up SQL query';
CREATE TABLE doc_sequences (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id BIGINT,
  code TEXT,
  prefix TEXT,
  suffix TEXT,
  next_number BIGINT DEFAULT 1,
  padding INT DEFAULT 5,
  reset_period TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT fk_doc_sequences_organization_id
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_doc_sequences_org_code_active ON doc_sequences (organization_id, code) WHERE deleted_at IS NULL;

-- +goose Down
SELECT 'down SQL query';
DROP TABLE doc_sequences;
