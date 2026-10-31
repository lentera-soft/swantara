-- +goose Up
SELECT 'up SQL query';
DROP INDEX IF EXISTS uq_item_variants_sku_active;
CREATE UNIQUE INDEX IF NOT EXISTS uq_item_variants_item_sku_active
  ON item_variants (item_id, sku)
  WHERE deleted_at IS NULL;

-- +goose Down
SELECT 'down SQL query';
DROP INDEX IF EXISTS uq_item_variants_item_sku_active;
CREATE UNIQUE INDEX IF NOT EXISTS uq_item_variants_sku_active
  ON item_variants (sku)
  WHERE deleted_at IS NULL;
