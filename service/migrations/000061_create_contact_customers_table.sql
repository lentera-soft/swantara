-- +goose Up
SELECT 'up SQL query';
CREATE TABLE contact_customers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  contact_id BIGINT NOT NULL,
  customer_payment_term_id BIGINT,
  credit_limit NUMERIC(18,4),
  receivable_account_id BIGINT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT fk_contact_customers_contact_id
    FOREIGN KEY (contact_id)
    REFERENCES contacts(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_contact_customers_customer_payment_term_id
    FOREIGN KEY (customer_payment_term_id)
    REFERENCES payment_terms(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_contact_customers_receivable_account_id
    FOREIGN KEY (receivable_account_id)
    REFERENCES accounts(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_contact_customers_contact_active ON contact_customers (contact_id) WHERE deleted_at IS NULL;

-- +goose Down
SELECT 'down SQL query';
DROP TABLE contact_customers;
