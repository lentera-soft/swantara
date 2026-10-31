-- +goose Up
CREATE TABLE fx_revaluation_lines (
    id BIGSERIAL PRIMARY KEY,
    revaluation_id BIGINT NOT NULL,
    account_id BIGINT NOT NULL,
    currency_code CHAR(3) NOT NULL,
    foreign_balance NUMERIC(18,4) NOT NULL DEFAULT 0,
    base_balance NUMERIC(18,4) NOT NULL DEFAULT 0,
    closing_rate NUMERIC(18,8) NOT NULL DEFAULT 0,
    gain_loss NUMERIC(18,4) NOT NULL DEFAULT 0,
    entry_id BIGINT,
    reversed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT fk_fx_revaluation_lines_revaluation FOREIGN KEY (revaluation_id) REFERENCES fx_revaluations(id),
    CONSTRAINT fk_fx_revaluation_lines_account FOREIGN KEY (account_id) REFERENCES accounts(id)
);

CREATE INDEX idx_fx_revaluation_lines_open ON fx_revaluation_lines(account_id) WHERE reversed = FALSE;

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

CREATE TRIGGER enforce_fxl_move BEFORE INSERT OR UPDATE OF entry_id ON fx_revaluation_lines
  FOR EACH ROW EXECUTE FUNCTION enforce_fk_exists('journal_entrys', 'entry_id');

-- +goose Down
DROP TABLE fx_revaluation_lines;