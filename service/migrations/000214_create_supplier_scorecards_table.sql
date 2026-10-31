-- +goose Up
SELECT 'up SQL query';
CREATE TABLE supplier_scorecards (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id BIGINT,
  supplier_id BIGINT NOT NULL,
  period_start DATE,
  period_end DATE,
  quality_score NUMERIC(5,2) DEFAULT 0,
  delivery_score NUMERIC(5,2) DEFAULT 0,
  price_score NUMERIC(5,2) DEFAULT 0,
  overall_score NUMERIC(5,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  on_time_deliveries INTEGER DEFAULT 0,
  quality_failures INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT fk_supplier_scorecards_organization_id
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_supplier_scorecards_supplier_id
    FOREIGN KEY (supplier_id)
    REFERENCES contacts(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION
);

-- +goose Down
SELECT 'down SQL query';
DROP TABLE supplier_scorecards;
