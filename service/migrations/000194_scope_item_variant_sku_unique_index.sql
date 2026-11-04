-- +goose Up
SELECT 'up SQL query';
DROP INDEX IF EXISTS uq_item_variants_sku_active;
CREATE UNIQUE INDEX IF NOT EXISTS uq_item_variants_item_sku_active
  ON item_variants (item_id, sku)
  WHERE deleted_at IS NULL;

-- +goose Down
SELECT 'down SQL query';
DROP INDEX IF EXISTS uq_item_variants_item_sku_active;
-- The global unique index on sku cannot be restored while duplicate active
-- SKUs exist across items (which per-item scoping legitimately allows), so
-- fall back to a non-unique index instead of failing the rollback.
-- +goose StatementBegin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM item_variants
    WHERE deleted_at IS NULL
    GROUP BY sku
    HAVING COUNT(*) > 1
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_item_variants_sku_active
      ON item_variants (sku)
      WHERE deleted_at IS NULL;
  ELSE
    RAISE NOTICE 'duplicate active SKUs across items exist; skipping global unique index uq_item_variants_sku_active';
    CREATE INDEX IF NOT EXISTS uq_item_variants_sku_active
      ON item_variants (sku)
      WHERE deleted_at IS NULL;
  END IF;
END
$$;
-- +goose StatementEnd
