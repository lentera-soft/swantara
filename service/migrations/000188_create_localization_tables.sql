-- +goose Up
SELECT 'up SQL query';
CREATE TABLE localization_profiles (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  country_code CHAR(2) NOT NULL,
  currency_code CHAR(3) NOT NULL,
  locale TEXT DEFAULT 'id-ID',
  timezone TEXT DEFAULT 'UTC',
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  tax_year_start_month SMALLINT DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_localization_profiles_country_active ON localization_profiles (country_code) WHERE deleted_at IS NULL;

CREATE TABLE localization_tax_template_lines (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  profile_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  kind TEXT,
  rate NUMERIC(8,4) DEFAULT 0,
  price_include BOOLEAN NOT NULL DEFAULT FALSE,
  tax_account_code TEXT,
  sequence INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT fk_localization_tax_template_lines_profile_id
    FOREIGN KEY (profile_id)
    REFERENCES localization_profiles(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
);

CREATE INDEX ix_localization_tax_template_lines_profile_id
  ON localization_tax_template_lines (profile_id);

-- +goose Down
SELECT 'down SQL query';
DROP TABLE localization_tax_template_lines;
DROP TABLE localization_profiles;
