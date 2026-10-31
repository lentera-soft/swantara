-- +goose Up
SELECT 'up SQL query';
ALTER TABLE prospects
  DROP CONSTRAINT IF EXISTS prospects_type_check;
ALTER TABLE prospects
  ADD CONSTRAINT prospects_type_check
  CHECK (type IN ('prospect','opportunity'));

-- +goose Down
SELECT 'down SQL query';
ALTER TABLE prospects
  DROP CONSTRAINT IF EXISTS prospects_type_check;
ALTER TABLE prospects
  ADD CONSTRAINT prospects_type_check
  CHECK (type IN ('lead','opportunity'));
