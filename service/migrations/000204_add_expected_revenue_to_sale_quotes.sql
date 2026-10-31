-- +goose Up
SELECT 'up SQL query';
ALTER TABLE sale_quotes ADD COLUMN expected_revenue NUMERIC(18,4);

-- +goose Down
SELECT 'down SQL query';
ALTER TABLE sale_quotes DROP COLUMN IF EXISTS expected_revenue;
