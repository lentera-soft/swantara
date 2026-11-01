-- +goose Up
SELECT 'up SQL query';
CREATE TABLE permissions(
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  action TEXT NOT NULL CHECK(action IN ('view','create','update','delete','approve','post','override')),
  resource TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_permissions_code_active ON permissions(code) WHERE deleted_at IS NULL;

CREATE INDEX idx_permissions_code
ON permissions(code);


-- +goose Down
SELECT 'down SQL query';
DROP TABLE permissions;