-- +goose Up
SELECT 'up SQL query';
ALTER TABLE sale_orders ADD COLUMN quote_id BIGINT;
ALTER TABLE sale_orders
  ADD CONSTRAINT fk_sale_orders_quote_id
  FOREIGN KEY (quote_id)
  REFERENCES sale_quotes(id)
  ON DELETE RESTRICT
  ON UPDATE NO ACTION;
CREATE INDEX idx_sale_orders_quote ON sale_orders(quote_id);

-- +goose Down
SELECT 'down SQL query';
DROP INDEX IF EXISTS idx_sale_orders_quote;
ALTER TABLE sale_orders DROP CONSTRAINT IF EXISTS fk_sale_orders_quote_id;
ALTER TABLE sale_orders DROP COLUMN IF EXISTS quote_id;
