-- +goose Up
SELECT 'up SQL query';
CREATE TABLE countries (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code CHAR(2) NOT NULL,
  name TEXT NOT NULL,
  currency_code CHAR(3) NOT NULL,
  timezone TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT fk_countries_currency_code
    FOREIGN KEY (currency_code)
    REFERENCES currencies(code)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_countries_code_active ON countries (code) WHERE deleted_at IS NULL;

-- +goose Down
SELECT 'down SQL query';
DROP TABLE countries;
