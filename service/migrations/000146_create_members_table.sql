-- +goose Up
SELECT 'up SQL query';
CREATE TABLE members (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL,
  organization_id BIGINT NOT NULL,
  position TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT fk_members_user_id
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_members_organization_id
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_members_user_org_active ON members (user_id, organization_id) WHERE deleted_at IS NULL;

-- +goose Down
SELECT 'down SQL query';
DROP TABLE members;
