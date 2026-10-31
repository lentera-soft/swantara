-- +goose Up
SELECT 'up SQL query';
ALTER TABLE audit_logs
  ADD COLUMN organization_id BIGINT,
  ADD COLUMN request_id TEXT;

-- Backfill organization_id for audit rows whose business table exposes it.
-- +goose StatementBegin
DO $$
DECLARE
  audited_table RECORD;
BEGIN
  FOR audited_table IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'organization_id'
      AND t.table_type = 'BASE TABLE'
      AND c.table_name <> 'audit_logs'
      AND EXISTS (
        SELECT 1 FROM information_schema.columns idc
        WHERE idc.table_schema = c.table_schema
          AND idc.table_name = c.table_name
          AND idc.column_name = 'id'
      )
  LOOP
    EXECUTE format(
      'UPDATE audit_logs al SET organization_id = src.organization_id FROM %I src WHERE al.organization_id IS NULL AND al.table_name = %L AND al.record_id = src.id',
      audited_table.table_name, audited_table.table_name
    );
  END LOOP;
END $$;
-- +goose StatementEnd

-- Organizations are their own tenant root.
UPDATE audit_logs SET organization_id = record_id
WHERE table_name = 'organizations' AND organization_id IS NULL;

CREATE INDEX idx_audit_logs_organization_created_at
  ON audit_logs(organization_id, created_at);
CREATE INDEX idx_audit_logs_table_record_changed_at
  ON audit_logs(table_name, record_id, changed_at);
CREATE INDEX idx_audit_logs_request_id
  ON audit_logs(request_id);

-- +goose Down
SELECT 'down SQL query';
DROP INDEX IF EXISTS idx_audit_logs_request_id;
DROP INDEX IF EXISTS idx_audit_logs_table_record_changed_at;
DROP INDEX IF EXISTS idx_audit_logs_organization_created_at;
ALTER TABLE audit_logs
  DROP COLUMN request_id,
  DROP COLUMN organization_id;
