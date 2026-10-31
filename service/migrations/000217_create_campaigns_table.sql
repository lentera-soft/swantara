-- +goose Up
SELECT 'up SQL query';
CREATE TABLE campaigns (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id BIGINT,
  code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  channel TEXT,
  status TEXT DEFAULT 'planned',
  start_date DATE,
  end_date DATE,
  budget NUMERIC(18,4),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT fk_campaigns_organization_id
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION
);

-- +goose Down
SELECT 'down SQL query';
DROP TABLE campaigns;
