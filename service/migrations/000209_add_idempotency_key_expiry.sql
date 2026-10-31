-- +goose Up
SELECT 'up SQL query';
ALTER TABLE idempotency_keys ADD COLUMN expires_at TIMESTAMP;
UPDATE idempotency_keys
SET expires_at = COALESCE(created_at, CURRENT_TIMESTAMP) + INTERVAL '24 hours'
WHERE expires_at IS NULL;
ALTER TABLE idempotency_keys
  ALTER COLUMN expires_at SET DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
  ALTER COLUMN expires_at SET NOT NULL;
CREATE INDEX idx_idempotency_keys_expires_at ON idempotency_keys(expires_at);

-- +goose Down
SELECT 'down SQL query';
DROP INDEX IF EXISTS idx_idempotency_keys_expires_at;
ALTER TABLE idempotency_keys DROP COLUMN expires_at;
