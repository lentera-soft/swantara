-- +goose Up
CREATE TABLE accruals (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL,
    period_id BIGINT NOT NULL,
    name TEXT,
    description TEXT,
    reversal_date DATE,
    state TEXT NOT NULL DEFAULT 'posted',
    entry_id BIGINT,
    reversal_entry_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT fk_accruals_organization FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_accruals_period FOREIGN KEY (period_id) REFERENCES tax_periods(id)
);

CREATE INDEX idx_accruals_org ON accruals(organization_id) WHERE deleted_at IS NULL;

-- +goose StatementBegin
CREATE OR REPLACE FUNCTION enforce_fk_exists() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  fk_val bigint;
  found  boolean;
BEGIN
  fk_val := (to_jsonb(NEW) ->> TG_ARGV[1])::bigint;
  IF fk_val IS NULL THEN
    RETURN NEW;
  END IF;
  EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I WHERE id = $1)', TG_ARGV[0])
    INTO found USING fk_val;
  IF NOT found THEN
    RAISE EXCEPTION 'referenced row in % with id % does not exist', TG_ARGV[0], fk_val;
  END IF;
  RETURN NEW;
END $$;
-- +goose StatementEnd

CREATE TRIGGER enforce_arl_move BEFORE INSERT OR UPDATE OF entry_id ON accruals
  FOR EACH ROW EXECUTE FUNCTION enforce_fk_exists('journal_entrys', 'entry_id');
CREATE TRIGGER enforce_arl_reversal BEFORE INSERT OR UPDATE OF reversal_entry_id ON accruals
  FOR EACH ROW EXECUTE FUNCTION enforce_fk_exists('journal_entrys', 'reversal_entry_id');

-- +goose Down
DROP TABLE accruals;