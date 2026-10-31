-- +goose Up
SELECT 'up SQL query';
DROP TABLE IF EXISTS organization_modules;

-- +goose Down
SELECT 'down SQL query';
-- Intentionally empty: runtime module management was removed.
