-- +goose Up
SELECT 'up SQL query';
CREATE TABLE organizations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  legal_name TEXT,
  parent_id BIGINT,
  base_currency CHAR(3) NOT NULL,
  country_code CHAR(2),
  tax_id TEXT,
  logo TEXT,
  timezone TEXT DEFAULT 'UTC',
  tax_year_start_month SMALLINT DEFAULT 1,
  auto_checkout_hour SMALLINT,
  rounding_minutes SMALLINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT fk_organizations_parent_id
    FOREIGN KEY (parent_id)
    REFERENCES organizations(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION
);

CREATE TABLE currencies (
  id BIGSERIAL PRIMARY KEY,
  code CHAR(3) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  symbol TEXT,
  decimal_places SMALLINT DEFAULT 2,
  rounding NUMERIC(12,6) DEFAULT 0.01,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TABLE contacts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id BIGINT,
  name TEXT NOT NULL,
  display_name TEXT,
  is_organization BOOLEAN DEFAULT false,
  parent_id BIGINT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  website TEXT,
  tax_id TEXT,
  industry TEXT,
  currency_code CHAR(3),
  lang TEXT DEFAULT 'en',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT fk_contacts_organization_id
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_contacts_parent_id
    FOREIGN KEY (parent_id)
    REFERENCES contacts(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_contacts_currency_code
    FOREIGN KEY (currency_code)
    REFERENCES currencies(code)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION
);

CREATE TABLE users(
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  password TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  birthday DATE DEFAULT NULL,
  active BOOLEAN DEFAULT FALSE,
  private BOOLEAN DEFAULT FALSE,
  sex TEXT CHECK (sex IN ('male', 'female')),
  address TEXT,
  city TEXT,
  postal_code TEXT,
  email_verified_at TIMESTAMP DEFAULT NULL,
  phone_verified_at TIMESTAMP DEFAULT NULL,
  contact_id BIGINT,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT fk_users_contact
    FOREIGN KEY (contact_id)
    REFERENCES contacts(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX idx_users_username_unique_active ON users(username) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_email_unique_active ON users(email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_phone_unique ON users(phone) WHERE deleted_at IS NULL;

-- +goose Down
SELECT 'down SQL query';
DROP INDEX IF EXISTS idx_users_username_unique_active;
DROP INDEX IF EXISTS idx_users_email_unique_active;
DROP INDEX IF EXISTS idx_users_phone_unique;
DROP TABLE users;
DROP TABLE contacts;
DROP TABLE currencies;
DROP TABLE organizations;
