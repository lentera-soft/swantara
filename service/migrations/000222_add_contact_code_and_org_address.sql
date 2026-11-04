-- +goose Up
SELECT 'up SQL query';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS postal_code TEXT;

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_code_unique_active ON contacts(organization_id, code) WHERE deleted_at IS NULL AND code IS NOT NULL;

-- +goose Down
SELECT 'down SQL query';
DROP INDEX IF EXISTS idx_contacts_code_unique_active;
ALTER TABLE contacts DROP COLUMN IF EXISTS code;
ALTER TABLE organizations DROP COLUMN IF EXISTS postal_code;
ALTER TABLE organizations DROP COLUMN IF EXISTS city;
ALTER TABLE organizations DROP COLUMN IF EXISTS address;
