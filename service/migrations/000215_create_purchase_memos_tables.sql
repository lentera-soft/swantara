-- +goose Up
SELECT 'up SQL query';
CREATE TABLE purchase_credit_memos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id BIGINT NOT NULL,
  journal_id BIGINT NOT NULL,
  contact_id BIGINT NOT NULL,
  date DATE,
  state TEXT CHECK (state IN ('posted')),
  amount_untaxed NUMERIC(18,4) DEFAULT 0,
  amount_tax NUMERIC(18,4) DEFAULT 0,
  amount_total NUMERIC(18,4) DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT fk_purchase_credit_memos_order_id
    FOREIGN KEY (order_id)
    REFERENCES purchase_orders(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_purchase_credit_memos_journal_id
    FOREIGN KEY (journal_id)
    REFERENCES journals(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_purchase_credit_memos_contact_id
    FOREIGN KEY (contact_id)
    REFERENCES contacts(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION
);

CREATE TABLE purchase_debit_memos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id BIGINT NOT NULL,
  journal_id BIGINT NOT NULL,
  contact_id BIGINT NOT NULL,
  date DATE,
  state TEXT CHECK (state IN ('posted')),
  amount_untaxed NUMERIC(18,4) DEFAULT 0,
  amount_tax NUMERIC(18,4) DEFAULT 0,
  amount_total NUMERIC(18,4) DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT fk_purchase_debit_memos_order_id
    FOREIGN KEY (order_id)
    REFERENCES purchase_orders(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_purchase_debit_memos_journal_id
    FOREIGN KEY (journal_id)
    REFERENCES journals(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_purchase_debit_memos_contact_id
    FOREIGN KEY (contact_id)
    REFERENCES contacts(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION
);

-- +goose Down
SELECT 'down SQL query';
DROP TABLE purchase_debit_memos;
DROP TABLE purchase_credit_memos;
