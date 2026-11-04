-- +goose Up
SELECT 'up SQL query';
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country_code CHAR(2);

-- +goose Down
SELECT 'down SQL query';
ALTER TABLE users DROP COLUMN IF EXISTS country_code;
ALTER TABLE users DROP COLUMN IF EXISTS country;
