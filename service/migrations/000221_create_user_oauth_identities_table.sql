-- +goose Up
SELECT 'up SQL query';

CREATE TABLE user_oauth_identities (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'facebook')),
  provider_user_id TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_user_oauth_identities_user_id
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX uq_user_oauth_identities_provider_user
  ON user_oauth_identities (provider, provider_user_id)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_user_oauth_identities_user_id
  ON user_oauth_identities (user_id)
  WHERE deleted_at IS NULL;

-- +goose Down
SELECT 'down SQL query';

DROP INDEX IF EXISTS idx_user_oauth_identities_user_id;
DROP INDEX IF EXISTS uq_user_oauth_identities_provider_user;
DROP TABLE user_oauth_identities;
