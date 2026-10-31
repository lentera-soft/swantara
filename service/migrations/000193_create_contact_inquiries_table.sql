-- +goose Up
SELECT 'up SQL query';
CREATE TABLE contact_inquiries (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX ix_contact_inquiries_status ON contact_inquiries (status);
CREATE INDEX ix_contact_inquiries_created_at ON contact_inquiries (created_at);

-- +goose Down
SELECT 'down SQL query';
DROP TABLE IF EXISTS contact_inquiries;
