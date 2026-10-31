-- +goose Up
SELECT 'up SQL query';
ALTER TABLE contact_inquiries
  ADD COLUMN conversion_claim_id TEXT,
  ADD COLUMN conversion_claimed_at TIMESTAMP;

CREATE INDEX idx_contact_inquiries_conversion_claim_id
  ON contact_inquiries(conversion_claim_id);

-- +goose Down
SELECT 'down SQL query';
DROP INDEX IF EXISTS idx_contact_inquiries_conversion_claim_id;
ALTER TABLE contact_inquiries
  DROP COLUMN conversion_claimed_at,
  DROP COLUMN conversion_claim_id;
