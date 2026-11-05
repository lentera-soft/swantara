-- +goose Up
SELECT 'up SQL query';
CREATE TABLE contact_inquiries (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  organization_id BIGINT,
  prospect_id BIGINT,
  source TEXT DEFAULT 'website',
  medium TEXT,
  campaign TEXT,
  conversion_claim_id TEXT,
  conversion_claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT fk_contact_inquiries_organization_id
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT fk_contact_inquiries_prospect_id
    FOREIGN KEY (prospect_id) REFERENCES prospects(id)
    ON DELETE SET NULL ON UPDATE NO ACTION
);

CREATE INDEX ix_contact_inquiries_status ON contact_inquiries (status);
CREATE INDEX ix_contact_inquiries_created_at ON contact_inquiries (created_at);
CREATE INDEX idx_contact_inquiries_organization_id ON contact_inquiries(organization_id, status);
CREATE INDEX idx_contact_inquiries_prospect_id ON contact_inquiries(prospect_id);
CREATE INDEX idx_contact_inquiries_conversion_claim_id ON contact_inquiries(conversion_claim_id);

-- +goose Down
SELECT 'down SQL query';
DROP TABLE IF EXISTS contact_inquiries;
