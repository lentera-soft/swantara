-- +goose Up
SELECT 'up SQL query';
CREATE TABLE sale_quote_lines (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  quote_id BIGINT NOT NULL,
  sequence INTEGER DEFAULT 10,
  item_id BIGINT,
  description TEXT,
  qty NUMERIC(18,4) NOT NULL,
  unit_id BIGINT,
  unit_price NUMERIC(18,4) DEFAULT 0,
  discount_pct NUMERIC(8,4) DEFAULT 0,
  tax_ids BIGINT[],
  dimension_id BIGINT,
  price_subtotal NUMERIC(18,4) DEFAULT 0,
  price_tax NUMERIC(18,4) DEFAULT 0,
  price_total NUMERIC(18,4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT fk_sale_quote_lines_quote_id
    FOREIGN KEY (quote_id)
    REFERENCES sale_quotes(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_sale_quote_lines_item_id
    FOREIGN KEY (item_id)
    REFERENCES items(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_sale_quote_lines_unit_id
    FOREIGN KEY (unit_id)
    REFERENCES units(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_sale_quote_lines_dimension_id
    FOREIGN KEY (dimension_id)
    REFERENCES dimensions(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION
);

CREATE INDEX idx_sale_quote_lines_quote ON sale_quote_lines(quote_id);

-- +goose Down
SELECT 'down SQL query';
DROP INDEX IF EXISTS idx_sale_quote_lines_quote;
DROP TABLE sale_quote_lines;
