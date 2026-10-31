-- +goose Up
SELECT 'up SQL query';
CREATE TABLE batches (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  item_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  ref TEXT,
  expiry_date DATE,
  best_before_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT fk_batchs_item_id
    FOREIGN KEY (item_id)
    REFERENCES item_variants(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_batches_item_name_active ON batches (item_id, name) WHERE deleted_at IS NULL;

-- +goose Down
SELECT 'down SQL query';
DROP TABLE batches;
