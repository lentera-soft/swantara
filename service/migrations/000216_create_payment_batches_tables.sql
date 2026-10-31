-- +goose Up
SELECT 'up SQL query';
CREATE TABLE payment_batches (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id BIGINT,
  journal_id BIGINT NOT NULL,
  contact_id BIGINT NOT NULL,
  date DATE,
  state TEXT CHECK (state IN ('draft','posted')),
  total_amount NUMERIC(18,4) DEFAULT 0,
  payment_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT fk_payment_batches_organization_id
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_payment_batches_journal_id
    FOREIGN KEY (journal_id)
    REFERENCES journals(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_payment_batches_contact_id
    FOREIGN KEY (contact_id)
    REFERENCES contacts(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION
);

CREATE TABLE payment_batch_lines (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  batch_id BIGINT NOT NULL,
  order_id BIGINT NOT NULL,
  amount NUMERIC(18,4),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT fk_payment_batch_lines_batch_id
    FOREIGN KEY (batch_id)
    REFERENCES payment_batches(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_payment_batch_lines_order_id
    FOREIGN KEY (order_id)
    REFERENCES purchase_orders(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION
);

-- +goose Down
SELECT 'down SQL query';
DROP TABLE payment_batch_lines;
DROP TABLE payment_batches;
