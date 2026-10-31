-- +goose Up
SELECT 'up SQL query';
ALTER TABLE invoices ADD COLUMN is_advance BOOLEAN NOT NULL DEFAULT FALSE;

-- +goose Down
SELECT 'down SQL query';
ALTER TABLE invoices DROP COLUMN IF EXISTS is_advance;
