-- +goose Up
SELECT 'up SQL query';
CREATE TABLE supply_agreements (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id BIGINT,
  name TEXT,
  supplier_id BIGINT NOT NULL,
  currency_code CHAR(3),
  state TEXT CHECK (state IN ('draft','active','expired','cancelled')),
  start_date DATE,
  end_date DATE,
  amount_limit NUMERIC(18,4) DEFAULT 0,
  qty_limit NUMERIC(18,4) DEFAULT 0,
  consumed_amount NUMERIC(18,4) DEFAULT 0,
  consumed_qty NUMERIC(18,4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT fk_supply_agreements_organization_id
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_supply_agreements_supplier_id
    FOREIGN KEY (supplier_id)
    REFERENCES contacts(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_supply_agreements_currency_code
    FOREIGN KEY (currency_code)
    REFERENCES currencies(code)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION
);

CREATE TABLE supply_agreement_lines (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  agreement_id BIGINT NOT NULL,
  item_id BIGINT,
  description TEXT,
  qty NUMERIC(18,4),
  unit_price NUMERIC(18,4),
  unit_id BIGINT,
  needed_by DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT fk_supply_agreement_lines_agreement_id
    FOREIGN KEY (agreement_id)
    REFERENCES supply_agreements(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_supply_agreement_lines_item_id
    FOREIGN KEY (item_id)
    REFERENCES item_variants(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_supply_agreement_lines_unit_id
    FOREIGN KEY (unit_id)
    REFERENCES units(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION
);

-- +goose Down
SELECT 'down SQL query';
DROP TABLE supply_agreement_lines;
DROP TABLE supply_agreements;
