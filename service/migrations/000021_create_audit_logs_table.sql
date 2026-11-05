-- +goose Up
SELECT 'up SQL query';
CREATE TABLE audit_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_name TEXT,
  record_id BIGINT,
  action TEXT CHECK (action IN ('insert','update','delete')),
  changed_by BIGINT,
  changed_at TIMESTAMP,
  diff JSONB,
  organization_id BIGINT,
  request_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_audit_logs_organization_created_at ON audit_logs(organization_id, created_at);
CREATE INDEX idx_audit_logs_table_record_changed_at ON audit_logs(table_name, record_id, changed_at);
CREATE INDEX idx_audit_logs_request_id ON audit_logs(request_id);

-- +goose Down
SELECT 'down SQL query';
DROP TABLE audit_logs;
