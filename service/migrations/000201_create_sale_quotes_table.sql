-- +goose Up
SELECT 'up SQL query';
CREATE TABLE sale_quotes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id BIGINT,
  name TEXT,
  contact_id BIGINT NOT NULL,
  price_book_id BIGINT,
  currency_code CHAR(3),
  salesperson_id BIGINT,
  sales_group_id BIGINT,
  prospect_id BIGINT,
  state TEXT CHECK (state IN ('draft','sent','accepted','expired','cancelled')),
  quote_date DATE,
  validity_date DATE,
  payment_term_id BIGINT,
  incoterm TEXT,
  customer_po_ref TEXT,
  amount_untaxed NUMERIC(18,4) DEFAULT 0,
  amount_tax NUMERIC(18,4) DEFAULT 0,
  amount_total NUMERIC(18,4) DEFAULT 0,
  expected_revenue NUMERIC(18,4),
  version INTEGER NOT NULL DEFAULT 1,
  root_quote_id BIGINT,
  previous_quote_id BIGINT,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  accepted_at TIMESTAMP,
  sale_order_id BIGINT,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT fk_sale_quotes_organization_id
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_sale_quotes_contact_id
    FOREIGN KEY (contact_id)
    REFERENCES contacts(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_sale_quotes_price_book_id
    FOREIGN KEY (price_book_id)
    REFERENCES price_books(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_sale_quotes_currency_code
    FOREIGN KEY (currency_code)
    REFERENCES currencies(code)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_sale_quotes_salesperson_id
    FOREIGN KEY (salesperson_id)
    REFERENCES contacts(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_sale_quotes_sales_group_id
    FOREIGN KEY (sales_group_id)
    REFERENCES sales_groups(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_sale_quotes_prospect_id
    FOREIGN KEY (prospect_id)
    REFERENCES prospects(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_sale_quotes_payment_term_id
    FOREIGN KEY (payment_term_id)
    REFERENCES payment_terms(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_sale_quotes_root_quote_id
    FOREIGN KEY (root_quote_id)
    REFERENCES sale_quotes(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_sale_quotes_previous_quote_id
    FOREIGN KEY (previous_quote_id)
    REFERENCES sale_quotes(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_sale_quotes_sale_order_id
    FOREIGN KEY (sale_order_id)
    REFERENCES sale_orders(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION
);

CREATE INDEX idx_sale_quotes_current ON sale_quotes(organization_id, is_current);
CREATE INDEX idx_sale_quotes_root ON sale_quotes(root_quote_id);
CREATE INDEX idx_sale_quotes_prospect ON sale_quotes(prospect_id);
CREATE INDEX idx_sale_quotes_sale_order ON sale_quotes(sale_order_id);

-- +goose Down
SELECT 'down SQL query';
DROP INDEX IF EXISTS idx_sale_quotes_sale_order;
DROP INDEX IF EXISTS idx_sale_quotes_prospect;
DROP INDEX IF EXISTS idx_sale_quotes_root;
DROP INDEX IF EXISTS idx_sale_quotes_current;
DROP TABLE sale_quotes;
