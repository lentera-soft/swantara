-- +goose Up
CREATE TABLE cost_centers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id BIGINT,
  name TEXT,
  code TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT fk_cost_centers_organization_id
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION
);
CREATE UNIQUE INDEX idx_cost_centers_org_code
  ON cost_centers (organization_id, code)
  WHERE deleted_at IS NULL;

-- +goose Down
DROP INDEX idx_cost_centers_org_code;
DROP TABLE cost_centers;
