-- +goose Up
SELECT 'up SQL query';
ALTER TABLE unit_groups ADD COLUMN organization_id BIGINT;
ALTER TABLE unit_groups ADD CONSTRAINT fk_unit_groups_organization_id
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
  ON DELETE RESTRICT ON UPDATE NO ACTION;
CREATE INDEX idx_unit_groups_organization_id ON unit_groups(organization_id);

ALTER TABLE units ADD COLUMN organization_id BIGINT;
ALTER TABLE units ADD CONSTRAINT fk_units_organization_id
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
  ON DELETE RESTRICT ON UPDATE NO ACTION;
CREATE INDEX idx_units_organization_id ON units(organization_id);

-- +goose Down
SELECT 'down SQL query';
ALTER TABLE units DROP CONSTRAINT IF EXISTS fk_units_organization_id;
DROP INDEX IF EXISTS idx_units_organization_id;
ALTER TABLE units DROP COLUMN IF EXISTS organization_id;

ALTER TABLE unit_groups DROP CONSTRAINT IF EXISTS fk_unit_groups_organization_id;
DROP INDEX IF EXISTS idx_unit_groups_organization_id;
ALTER TABLE unit_groups DROP COLUMN IF EXISTS organization_id;
