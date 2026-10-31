-- +goose Up
SELECT 'up SQL query';
ALTER TABLE contact_inquiries
  ADD COLUMN organization_id BIGINT,
  ADD COLUMN prospect_id BIGINT,
  ADD COLUMN source TEXT DEFAULT 'website',
  ADD COLUMN medium TEXT,
  ADD COLUMN campaign TEXT;

ALTER TABLE contact_inquiries
  ADD CONSTRAINT fk_contact_inquiries_organization_id
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE SET NULL ON UPDATE NO ACTION,
  ADD CONSTRAINT fk_contact_inquiries_prospect_id
    FOREIGN KEY (prospect_id) REFERENCES prospects(id)
    ON DELETE SET NULL ON UPDATE NO ACTION;

CREATE INDEX idx_contact_inquiries_organization_id
  ON contact_inquiries(organization_id, status);
CREATE INDEX idx_contact_inquiries_prospect_id
  ON contact_inquiries(prospect_id);

-- +goose Down
SELECT 'down SQL query';
DROP INDEX IF EXISTS idx_contact_inquiries_prospect_id;
DROP INDEX IF EXISTS idx_contact_inquiries_organization_id;
ALTER TABLE contact_inquiries
  DROP CONSTRAINT IF EXISTS fk_contact_inquiries_prospect_id,
  DROP CONSTRAINT IF EXISTS fk_contact_inquiries_organization_id;
ALTER TABLE contact_inquiries
  DROP COLUMN campaign,
  DROP COLUMN medium,
  DROP COLUMN source,
  DROP COLUMN prospect_id,
  DROP COLUMN organization_id;
