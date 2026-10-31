-- +goose Up
SELECT 'up SQL query';
CREATE TABLE prospect_contacts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  prospect_id BIGINT NOT NULL,
  contact_id BIGINT NOT NULL,
  role TEXT NOT NULL DEFAULT 'influencer',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT fk_prospect_contacts_prospect_id
    FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE,
  CONSTRAINT fk_prospect_contacts_contact_id
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE RESTRICT,
  CONSTRAINT prospect_contacts_role_check
    CHECK (role IN ('user','technical','economic_buyer','champion','blocker','influencer','other'))
);

CREATE UNIQUE INDEX idx_prospect_contacts_unique
  ON prospect_contacts(prospect_id, contact_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_prospect_contacts_contact_id ON prospect_contacts(contact_id);

-- +goose Down
SELECT 'down SQL query';
DROP TABLE prospect_contacts;
