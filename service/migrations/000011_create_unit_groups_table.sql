-- +goose Up
SELECT 'up SQL query';
CREATE TABLE unit_groups (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  organization_id BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT fk_unit_groups_organization_id
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION
);

CREATE INDEX idx_unit_groups_organization_id ON unit_groups(organization_id);

-- +goose Down
SELECT 'down SQL query';
DROP TABLE unit_groups;
