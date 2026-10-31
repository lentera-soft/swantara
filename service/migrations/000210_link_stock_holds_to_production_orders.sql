-- +goose Up
SELECT 'up SQL query';
ALTER TABLE stock_holds ADD COLUMN production_order_id BIGINT;
ALTER TABLE stock_holds
  ADD CONSTRAINT fk_stock_holds_production_order_id
  FOREIGN KEY (production_order_id)
  REFERENCES production_orders(id)
  ON DELETE SET NULL
  ON UPDATE NO ACTION;
CREATE INDEX idx_stock_holds_production_order_id ON stock_holds(production_order_id);

-- +goose Down
SELECT 'down SQL query';
DROP INDEX IF EXISTS idx_stock_holds_production_order_id;
ALTER TABLE stock_holds DROP CONSTRAINT IF EXISTS fk_stock_holds_production_order_id;
ALTER TABLE stock_holds DROP COLUMN IF EXISTS production_order_id;
