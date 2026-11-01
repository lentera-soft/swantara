-- +goose Up
SELECT 'up SQL query';

CREATE TABLE billing_plans (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  provider TEXT,
  provider_product_id TEXT,
  provider_price_id TEXT,
  billing_interval TEXT NOT NULL DEFAULT 'month',
  interval_count INT NOT NULL DEFAULT 1,
  amount NUMERIC(18,4) NOT NULL DEFAULT 0,
  currency_code CHAR(3) NOT NULL,
  trial_days INT NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  provider_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_billing_plans_currency_code
    FOREIGN KEY (currency_code)
    REFERENCES currencies(code)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT billing_plans_interval_check
    CHECK (billing_interval IN ('day', 'week', 'month', 'year')),
  CONSTRAINT billing_plans_interval_count_check
    CHECK (interval_count > 0),
  CONSTRAINT billing_plans_amount_check
    CHECK (amount >= 0),
  CONSTRAINT billing_plans_trial_days_check
    CHECK (trial_days >= 0)
);

CREATE UNIQUE INDEX uq_billing_plans_code_active
  ON billing_plans (code)
  WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_billing_plans_provider_price
  ON billing_plans (provider, provider_price_id)
  WHERE provider_price_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_billing_plans_active_sort
  ON billing_plans (active, sort_order)
  WHERE deleted_at IS NULL;

CREATE TABLE billing_customers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id BIGINT NOT NULL,
  user_id BIGINT,
  provider TEXT NOT NULL,
  provider_customer_id TEXT NOT NULL,
  email TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_billing_customers_organization_id
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_billing_customers_user_id
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX uq_billing_customers_org_provider
  ON billing_customers (organization_id, provider)
  WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_billing_customers_provider_id
  ON billing_customers (provider, provider_customer_id)
  WHERE deleted_at IS NULL;

CREATE TABLE billing_subscriptions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id BIGINT NOT NULL,
  user_id BIGINT,
  plan_id BIGINT NOT NULL,
  provider TEXT NOT NULL,
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'incomplete',
  provider_status TEXT,
  quantity INT NOT NULL DEFAULT 1,
  currency_code CHAR(3),
  unit_amount NUMERIC(18,4),
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  provider_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_billing_subscriptions_organization_id
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_billing_subscriptions_user_id
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE NO ACTION,
  CONSTRAINT fk_billing_subscriptions_plan_id
    FOREIGN KEY (plan_id)
    REFERENCES billing_plans(id)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT fk_billing_subscriptions_currency_code
    FOREIGN KEY (currency_code)
    REFERENCES currencies(code)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT billing_subscriptions_status_check
    CHECK (status IN (
      'incomplete',
      'incomplete_expired',
      'trialing',
      'active',
      'past_due',
      'unpaid',
      'paused',
      'canceled'
    )),
  CONSTRAINT billing_subscriptions_quantity_check
    CHECK (quantity > 0)
);

CREATE UNIQUE INDEX uq_billing_subscriptions_provider_id
  ON billing_subscriptions (provider, provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_billing_subscriptions_organization_id
  ON billing_subscriptions (organization_id)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_billing_subscriptions_status
  ON billing_subscriptions (status)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_billing_subscriptions_period_end
  ON billing_subscriptions (current_period_end)
  WHERE status IN ('trialing', 'active', 'past_due') AND deleted_at IS NULL;

CREATE TABLE billing_webhook_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id BIGINT,
  provider TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  error TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_billing_webhook_events_organization_id
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE SET NULL
    ON UPDATE NO ACTION,
  CONSTRAINT billing_webhook_events_status_check
    CHECK (status IN ('pending', 'processed', 'failed', 'ignored'))
);

CREATE UNIQUE INDEX uq_billing_webhook_events_provider_event
  ON billing_webhook_events (provider, provider_event_id);
CREATE INDEX idx_billing_webhook_events_status
  ON billing_webhook_events (status, created_at)
  WHERE deleted_at IS NULL;

-- +goose Down
SELECT 'down SQL query';
DROP TABLE billing_webhook_events;
DROP TABLE billing_subscriptions;
DROP TABLE billing_customers;
DROP TABLE billing_plans;
