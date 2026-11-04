# Model

This document elaborates the data modeling definition for each entity in this project.
Generated from the applied database schema in `service/migrations/`.

Total entities: 200 (partitioned tables such as `journal_entrys_*` and `stock_movements_*` are represented by their parent table).

## Entities

- [account_full_reconciles](#account_full_reconciles)
- [account_partial_reconciles](#account_partial_reconciles)
- [accounts](#accounts)
- [accrual_lines](#accrual_lines)
- [accruals](#accruals)
- [approval_requests](#approval_requests)
- [approval_steps](#approval_steps)
- [asset_categories](#asset_categories)
- [asset_depreciation_lines](#asset_depreciation_lines)
- [attachments](#attachments)
- [attendances](#attendances)
- [audit_logs](#audit_logs)
- [bank_statement_lines](#bank_statement_lines)
- [bank_statements](#bank_statements)
- [batches](#batches)
- [billing_customers](#billing_customers)
- [billing_plans](#billing_plans)
- [billing_subscriptions](#billing_subscriptions)
- [billing_webhook_events](#billing_webhook_events)
- [budget_lines](#budget_lines)
- [budgets](#budgets)
- [campaigns](#campaigns)
- [carriers](#carriers)
- [commission_assignments](#commission_assignments)
- [commission_entries](#commission_entries)
- [commission_plans](#commission_plans)
- [commission_rules](#commission_rules)
- [consolidation_eliminations](#consolidation_eliminations)
- [consolidation_runs](#consolidation_runs)
- [consumed_materials](#consumed_materials)
- [contact_addresses](#contact_addresses)
- [contact_bank_accounts](#contact_bank_accounts)
- [contact_customers](#contact_customers)
- [contact_inquiries](#contact_inquiries)
- [contact_suppliers](#contact_suppliers)
- [contacts](#contacts)
- [cost_centers](#cost_centers)
- [cost_layers](#cost_layers)
- [countries](#countries)
- [coupons](#coupons)
- [currencies](#currencies)
- [deferred_schedule_lines](#deferred_schedule_lines)
- [deferred_schedules](#deferred_schedules)
- [demand_plans](#demand_plans)
- [departments](#departments)
- [dimension_distributions](#dimension_distributions)
- [dimensions](#dimensions)
- [doc_sequences](#doc_sequences)
- [down_payment_links](#down_payment_links)
- [dropship_links](#dropship_links)
- [employees](#employees)
- [employment_contracts](#employment_contracts)
- [equipments](#equipments)
- [expense_categories](#expense_categories)
- [expense_lines](#expense_lines)
- [expense_reports](#expense_reports)
- [fixed_assets](#fixed_assets)
- [fx_rates](#fx_rates)
- [fx_revaluation_lines](#fx_revaluation_lines)
- [fx_revaluations](#fx_revaluations)
- [gift_card_transactions](#gift_card_transactions)
- [gift_cards](#gift_cards)
- [idempotency_keys](#idempotency_keys)
- [inbound_cost_adjustments](#inbound_cost_adjustments)
- [inbound_cost_lines](#inbound_cost_lines)
- [inbound_costs](#inbound_costs)
- [integration_events](#integration_events)
- [interorganization_rules](#interorganization_rules)
- [interorganization_transactions](#interorganization_transactions)
- [invoice_contra_settlements](#invoice_contra_settlements)
- [invoice_credit_applications](#invoice_credit_applications)
- [invoice_installments](#invoice_installments)
- [invoice_lines](#invoice_lines)
- [invoice_taxes](#invoice_taxes)
- [invoices](#invoices)
- [item_attribute_values](#item_attribute_values)
- [item_attributes](#item_attributes)
- [item_categories](#item_categories)
- [item_variants](#item_variants)
- [items](#items)
- [job_positions](#job_positions)
- [job_runs](#job_runs)
- [journal_entrys](#journal_entrys)
- [journal_lines](#journal_lines)
- [journals](#journals)
- [kpi_account_summaries](#kpi_account_summaries)
- [leave_requests](#leave_requests)
- [leave_types](#leave_types)
- [localization_profiles](#localization_profiles)
- [localization_tax_template_lines](#localization_tax_template_lines)
- [maintenance_plans](#maintenance_plans)
- [member_role_assignments](#member_role_assignments)
- [member_role_permissions](#member_role_permissions)
- [member_roles](#member_roles)
- [members](#members)
- [messages](#messages)
- [organizations](#organizations)
- [outside_processing_orders](#outside_processing_orders)
- [payment_allocations](#payment_allocations)
- [payment_batch_lines](#payment_batch_lines)
- [payment_batches](#payment_batches)
- [payment_term_lines](#payment_term_lines)
- [payment_terms](#payment_terms)
- [payments](#payments)
- [payroll_runs](#payroll_runs)
- [payslip_lines](#payslip_lines)
- [payslips](#payslips)
- [pdc_instruments](#pdc_instruments)
- [period_close_entries](#period_close_entries)
- [permissions](#permissions)
- [pipeline_stages](#pipeline_stages)
- [planned_supplies](#planned_supplies)
- [planning_needs](#planning_needs)
- [planning_runs](#planning_runs)
- [pos_configs](#pos_configs)
- [pos_order_lines](#pos_order_lines)
- [pos_orders](#pos_orders)
- [pos_payment_accounts](#pos_payment_accounts)
- [pos_payments](#pos_payments)
- [pos_sessions](#pos_sessions)
- [price_books](#price_books)
- [price_rules](#price_rules)
- [production_orders](#production_orders)
- [production_steps](#production_steps)
- [project_invoice_lines](#project_invoice_lines)
- [project_milestones](#project_milestones)
- [project_tasks](#project_tasks)
- [projects](#projects)
- [prospect_activities](#prospect_activities)
- [prospect_contacts](#prospect_contacts)
- [prospect_stage_histories](#prospect_stage_histories)
- [prospects](#prospects)
- [purchase_credit_memos](#purchase_credit_memos)
- [purchase_debit_memos](#purchase_debit_memos)
- [purchase_order_lines](#purchase_order_lines)
- [purchase_orders](#purchase_orders)
- [purchase_request_lines](#purchase_request_lines)
- [purchase_requests](#purchase_requests)
- [quality_alerts](#quality_alerts)
- [quality_checks](#quality_checks)
- [quality_points](#quality_points)
- [recipe_lines](#recipe_lines)
- [recipes](#recipes)
- [reminder_actions](#reminder_actions)
- [reminder_levels](#reminder_levels)
- [reorder_rules](#reorder_rules)
- [rma_lines](#rma_lines)
- [rmas](#rmas)
- [salary_rules](#salary_rules)
- [sale_order_lines](#sale_order_lines)
- [sale_orders](#sale_orders)
- [sale_quote_lines](#sale_quote_lines)
- [sale_quotes](#sale_quotes)
- [sales_groups](#sales_groups)
- [service_contracts](#service_contracts)
- [service_order_lines](#service_order_lines)
- [service_orders](#service_orders)
- [shift_assignments](#shift_assignments)
- [shifts](#shifts)
- [shipments](#shipments)
- [shop_tasks](#shop_tasks)
- [stock_balances](#stock_balances)
- [stock_count_lines](#stock_count_lines)
- [stock_counts](#stock_counts)
- [stock_holds](#stock_holds)
- [stock_locations](#stock_locations)
- [stock_movements](#stock_movements)
- [subscription_lines](#subscription_lines)
- [subscription_plans](#subscription_plans)
- [subscriptions](#subscriptions)
- [supplier_products](#supplier_products)
- [supplier_quote_lines](#supplier_quote_lines)
- [supplier_quote_request_lines](#supplier_quote_request_lines)
- [supplier_quote_requests](#supplier_quote_requests)
- [supplier_quotes](#supplier_quotes)
- [supplier_scorecards](#supplier_scorecards)
- [supply_agreement_lines](#supply_agreement_lines)
- [supply_agreements](#supply_agreements)
- [system_configs](#system_configs)
- [tax_periods](#tax_periods)
- [tax_returns](#tax_returns)
- [tax_rule_account_maps](#tax_rule_account_maps)
- [tax_rule_tax_maps](#tax_rule_tax_maps)
- [tax_rules](#tax_rules)
- [tax_years](#tax_years)
- [taxes](#taxes)
- [timesheets](#timesheets)
- [unit_groups](#unit_groups)
- [units](#units)
- [user_email_verifications](#user_email_verifications)
- [user_oauth_identities](#user_oauth_identities)
- [user_password_resets](#user_password_resets)
- [user_sessions](#user_sessions)
- [users](#users)
- [warehouse_transfers](#warehouse_transfers)
- [warehouses](#warehouses)
- [webhook_deliveries](#webhook_deliveries)
- [webhook_subscriptions](#webhook_subscriptions)
- [withholding_taxes](#withholding_taxes)
- [work_centers](#work_centers)

### account_full_reconciles

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `name` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

### account_partial_reconciles

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `debit_line_id` | bigint | YES |  |
| `credit_line_id` | bigint | YES |  |
| `amount` | numeric(18,4) | YES |  |
| `full_reconcile_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `full_reconcile_id` -> `account_full_reconciles`.`id`

### accounts

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | NO |  |
| `code` | text | NO |  |
| `name` | text | NO |  |
| `type` | text | YES |  |
| `reconcilable` | boolean | YES | false |
| `currency_code` | char(3) | YES |  |
| `parent_id` | bigint | YES |  |
| `active` | boolean | YES | true |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `currency_code` -> `currencies`.`code`
- `organization_id` -> `organizations`.`id`
- `parent_id` -> `accounts`.`id`

### accrual_lines

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('accrual_lines_id_seq'::regclass) |
| `accrual_id` | bigint | NO |  |
| `account_id` | bigint | NO |  |
| `name` | text | YES |  |
| `debit` | numeric(18,4) | NO | 0 |
| `credit` | numeric(18,4) | NO | 0 |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |
| `deleted_at` | timestamptz | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `account_id` -> `accounts`.`id`
- `accrual_id` -> `accruals`.`id`

### accruals

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('accruals_id_seq'::regclass) |
| `organization_id` | bigint | NO |  |
| `period_id` | bigint | NO |  |
| `name` | text | YES |  |
| `description` | text | YES |  |
| `reversal_date` | date | YES |  |
| `state` | text | NO | 'posted'::text |
| `entry_id` | bigint | YES |  |
| `reversal_entry_id` | bigint | YES |  |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |
| `deleted_at` | timestamptz | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`
- `period_id` -> `tax_periods`.`id`

### approval_requests

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `owner_type` | text | YES |  |
| `owner_id` | bigint | YES |  |
| `requested_by` | bigint | YES |  |
| `state` | text | YES |  |
| `organization_id` | bigint | NO |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`

### approval_steps

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `request_id` | bigint | YES |  |
| `approver_id` | bigint | YES |  |
| `sequence` | integer | YES |  |
| `decision` | text | YES |  |
| `decided_at` | timestamp | YES |  |
| `comment` | text | YES |  |
| `organization_id` | bigint | NO |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`
- `request_id` -> `approval_requests`.`id`

### asset_categories

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `name` | text | YES |  |
| `organization_id` | bigint | YES |  |
| `asset_account_id` | bigint | YES |  |
| `depreciation_account_id` | bigint | YES |  |
| `expense_account_id` | bigint | YES |  |
| `method` | text | YES |  |
| `method_number` | integer | YES |  |
| `method_period` | text | YES |  |
| `gain_account_id` | bigint | YES |  |
| `loss_account_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `asset_account_id` -> `accounts`.`id`
- `depreciation_account_id` -> `accounts`.`id`
- `expense_account_id` -> `accounts`.`id`
- `gain_account_id` -> `accounts`.`id`
- `loss_account_id` -> `accounts`.`id`
- `organization_id` -> `organizations`.`id`

### asset_depreciation_lines

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `asset_id` | bigint | YES |  |
| `sequence` | integer | YES |  |
| `depreciation_date` | date | YES |  |
| `amount` | numeric(18,4) | YES |  |
| `accumulated` | numeric(18,4) | YES |  |
| `remaining_value` | numeric(18,4) | YES |  |
| `entry_id` | bigint | YES |  |
| `posted` | boolean | YES | false |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `asset_id` -> `fixed_assets`.`id`

### attachments

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `owner_type` | text | YES |  |
| `owner_id` | bigint | YES |  |
| `filename` | text | YES |  |
| `mime_type` | text | YES |  |
| `byte_size` | bigint | YES |  |
| `storage_url` | text | YES |  |
| `checksum` | text | YES |  |
| `uploaded_by` | bigint | YES |  |
| `uploaded_at` | timestamp | YES |  |
| `organization_id` | bigint | NO |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`

### attendances

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `employee_id` | bigint | NO |  |
| `organization_id` | bigint | NO |  |
| `check_in` | timestamp | YES |  |
| `check_out` | timestamp | YES |  |
| `worked_hours` | numeric(8,2) | YES |  |
| `status` | varchar(20) | NO | 'draft'::character varying |
| `attendance_type` | varchar(20) | NO | 'normal'::character varying |
| `source` | varchar(30) | NO | 'manual'::character varying |
| `break_minutes` | integer | NO | 0 |
| `overtime_hours` | numeric(8,2) | NO | 0 |
| `late_minutes` | integer | NO | 0 |
| `early_departure_minutes` | integer | NO | 0 |
| `notes` | text | YES |  |
| `confirmed_at` | timestamp | YES |  |
| `shift_id` | bigint | YES |  |
| `latitude` | numeric(10,7) | YES |  |
| `longitude` | numeric(10,7) | YES |  |
| `device_id` | varchar(255) | YES |  |
| `ip_address` | varchar(45) | YES |  |
| `user_agent` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `employee_id` -> `employees`.`id`
- `organization_id` -> `organizations`.`id`
- `shift_id` -> `shifts`.`id`

### audit_logs

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `table_name` | text | YES |  |
| `record_id` | bigint | YES |  |
| `action` | text | YES |  |
| `changed_by` | bigint | YES |  |
| `changed_at` | timestamp | YES |  |
| `diff` | jsonb | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |
| `organization_id` | bigint | YES |  |
| `request_id` | text | YES |  |

**Primary key:** `id`

### bank_statement_lines

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `statement_id` | bigint | YES |  |
| `date` | date | YES |  |
| `amount` | numeric(18,4) | YES |  |
| `contact_id` | bigint | YES |  |
| `ref` | text | YES |  |
| `narration` | text | YES |  |
| `reconciled` | boolean | YES | false |
| `payment_id` | bigint | YES |  |
| `journal_line_id` | bigint | YES |  |
| `currency_code` | char(3) | YES |  |
| `fee_amount` | numeric(18,4) | YES | 0 |
| `interest_amount` | numeric(18,4) | YES | 0 |
| `fee_entry_id` | bigint | YES |  |
| `interest_entry_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `contact_id` -> `contacts`.`id`
- `payment_id` -> `payments`.`id`
- `statement_id` -> `bank_statements`.`id`

### bank_statements

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `journal_id` | bigint | YES |  |
| `name` | text | YES |  |
| `date` | date | YES |  |
| `balance_start` | numeric(18,4) | YES |  |
| `balance_end` | numeric(18,4) | YES |  |
| `state` | text | YES |  |
| `currency_code` | char(3) | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `journal_id` -> `journals`.`id`

### batches

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `item_id` | bigint | NO |  |
| `name` | text | NO |  |
| `ref` | text | YES |  |
| `expiry_date` | date | YES |  |
| `best_before_date` | date | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `item_id` -> `item_variants`.`id`

### billing_customers

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | NO |  |
| `user_id` | bigint | YES |  |
| `provider` | text | NO |  |
| `provider_customer_id` | text | NO |  |
| `email` | text | YES |  |
| `metadata` | jsonb | NO | '{}'::jsonb |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |
| `deleted_at` | timestamptz | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`
- `user_id` -> `users`.`id`

### billing_plans

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `code` | text | NO |  |
| `name` | text | NO |  |
| `description` | text | YES |  |
| `provider` | text | YES |  |
| `provider_product_id` | text | YES |  |
| `provider_price_id` | text | YES |  |
| `billing_interval` | text | NO | 'month'::text |
| `interval_count` | integer | NO | 1 |
| `amount` | numeric(18,4) | NO | 0 |
| `currency_code` | char(3) | NO |  |
| `trial_days` | integer | NO | 0 |
| `features` | jsonb | NO | '[]'::jsonb |
| `limits` | jsonb | NO | '{}'::jsonb |
| `provider_data` | jsonb | NO | '{}'::jsonb |
| `active` | boolean | NO | true |
| `sort_order` | integer | NO | 0 |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |
| `deleted_at` | timestamptz | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `currency_code` -> `currencies`.`code`

### billing_subscriptions

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | NO |  |
| `user_id` | bigint | YES |  |
| `plan_id` | bigint | NO |  |
| `provider` | text | NO |  |
| `provider_customer_id` | text | YES |  |
| `provider_subscription_id` | text | YES |  |
| `status` | text | NO | 'incomplete'::text |
| `provider_status` | text | YES |  |
| `quantity` | integer | NO | 1 |
| `currency_code` | char(3) | YES |  |
| `unit_amount` | numeric(18,4) | YES |  |
| `trial_start` | timestamptz | YES |  |
| `trial_end` | timestamptz | YES |  |
| `current_period_start` | timestamptz | YES |  |
| `current_period_end` | timestamptz | YES |  |
| `cancel_at_period_end` | boolean | NO | false |
| `canceled_at` | timestamptz | YES |  |
| `ended_at` | timestamptz | YES |  |
| `provider_data` | jsonb | NO | '{}'::jsonb |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |
| `deleted_at` | timestamptz | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `currency_code` -> `currencies`.`code`
- `organization_id` -> `organizations`.`id`
- `plan_id` -> `billing_plans`.`id`
- `user_id` -> `users`.`id`

### billing_webhook_events

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `provider` | text | NO |  |
| `provider_event_id` | text | NO |  |
| `event_type` | text | NO |  |
| `payload` | jsonb | NO |  |
| `status` | text | NO | 'pending'::text |
| `attempts` | integer | NO | 0 |
| `error` | text | YES |  |
| `processed_at` | timestamptz | YES |  |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |
| `deleted_at` | timestamptz | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`

### budget_lines

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `budget_id` | bigint | YES |  |
| `account_id` | bigint | YES |  |
| `dimension_id` | bigint | YES |  |
| `planned_amount` | numeric(18,4) | YES |  |
| `practical_amount` | numeric(18,4) | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `account_id` -> `accounts`.`id`
- `budget_id` -> `budgets`.`id`
- `dimension_id` -> `dimensions`.`id`

### budgets

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `date_start` | date | YES |  |
| `date_end` | date | YES |  |
| `state` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`

### campaigns

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `code` | text | YES |  |
| `name` | text | NO |  |
| `description` | text | YES |  |
| `channel` | text | YES |  |
| `status` | text | YES | 'planned'::text |
| `start_date` | date | YES |  |
| `end_date` | date | YES |  |
| `budget` | numeric(18,4) | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`

### carriers

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `tracking_url_tpl` | text | YES |  |
| `delivery_item_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`

### commission_assignments

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `plan_id` | bigint | YES |  |
| `salesperson_id` | bigint | YES |  |
| `date_start` | date | YES |  |
| `date_end` | date | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `plan_id` -> `commission_plans`.`id`
- `salesperson_id` -> `contacts`.`id`

### commission_entries

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `salesperson_id` | bigint | YES |  |
| `plan_id` | bigint | YES |  |
| `source_type` | text | YES |  |
| `source_id` | bigint | YES |  |
| `base_amount` | numeric(18,4) | YES |  |
| `commission_amount` | numeric(18,4) | YES |  |
| `state` | text | YES |  |
| `period_id` | bigint | YES |  |
| `payslip_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `payslip_id` -> `payslips`.`id`
- `period_id` -> `tax_periods`.`id`
- `plan_id` -> `commission_plans`.`id`
- `salesperson_id` -> `contacts`.`id`

### commission_plans

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `basis` | text | YES |  |
| `active` | boolean | YES | true |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`

### commission_rules

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `plan_id` | bigint | YES |  |
| `item_category_id` | bigint | YES |  |
| `min_amount` | numeric(18,4) | YES |  |
| `max_amount` | numeric(18,4) | YES |  |
| `rate_pct` | numeric(8,4) | YES |  |
| `fixed_amount` | numeric(18,4) | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `item_category_id` -> `item_categories`.`id`
- `plan_id` -> `commission_plans`.`id`

### consolidation_eliminations

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `consolidation_run_id` | bigint | YES |  |
| `account_id` | bigint | YES |  |
| `counterparty_organization_id` | bigint | YES |  |
| `amount` | numeric(18,4) | YES |  |
| `description` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `account_id` -> `accounts`.`id`
- `consolidation_run_id` -> `consolidation_runs`.`id`

### consolidation_runs

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `group_organization_id` | bigint | YES |  |
| `period_id` | bigint | YES |  |
| `reporting_currency` | char(3) | YES |  |
| `state` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `group_organization_id` -> `organizations`.`id`
- `period_id` -> `tax_periods`.`id`
- `reporting_currency` -> `currencies`.`code`

### consumed_materials

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `production_order_id` | bigint | NO |  |
| `item_id` | bigint | NO |  |
| `qty_planned` | numeric(18,4) | YES |  |
| `qty_consumed` | numeric(18,4) | YES | 0 |
| `unit_id` | bigint | YES |  |
| `stock_movement_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `item_id` -> `item_variants`.`id`
- `production_order_id` -> `production_orders`.`id`
- `unit_id` -> `units`.`id`

### contact_addresses

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `contact_id` | bigint | NO |  |
| `type` | text | YES |  |
| `line1` | text | YES |  |
| `line2` | text | YES |  |
| `city` | text | YES |  |
| `state` | text | YES |  |
| `postal_code` | text | YES |  |
| `country_code` | char(2) | YES |  |
| `is_default` | boolean | YES | false |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `contact_id` -> `contacts`.`id`

### contact_bank_accounts

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `contact_id` | bigint | NO |  |
| `account_holder` | text | YES |  |
| `bank_name` | text | YES |  |
| `iban` | text | YES |  |
| `swift_bic` | text | YES |  |
| `account_number` | text | YES |  |
| `routing_number` | text | YES |  |
| `currency_code` | char(3) | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `contact_id` -> `contacts`.`id`
- `currency_code` -> `currencies`.`code`

### contact_customers

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `contact_id` | bigint | NO |  |
| `customer_payment_term_id` | bigint | YES |  |
| `credit_limit` | numeric(18,4) | YES |  |
| `receivable_account_id` | bigint | YES |  |
| `active` | boolean | YES | true |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `contact_id` -> `contacts`.`id`
- `customer_payment_term_id` -> `payment_terms`.`id`
- `receivable_account_id` -> `accounts`.`id`

### contact_inquiries

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `name` | text | NO |  |
| `email` | text | NO |  |
| `company` | text | YES |  |
| `message` | text | NO |  |
| `status` | text | NO | 'new'::text |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |
| `organization_id` | bigint | YES |  |
| `prospect_id` | bigint | YES |  |
| `source` | text | YES | 'website'::text |
| `medium` | text | YES |  |
| `campaign` | text | YES |  |
| `conversion_claim_id` | text | YES |  |
| `conversion_claimed_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`
- `prospect_id` -> `prospects`.`id`

### contact_suppliers

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `contact_id` | bigint | NO |  |
| `supplier_payment_term_id` | bigint | YES |  |
| `payable_account_id` | bigint | YES |  |
| `active` | boolean | YES | true |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `contact_id` -> `contacts`.`id`
- `payable_account_id` -> `accounts`.`id`
- `supplier_payment_term_id` -> `payment_terms`.`id`

### contacts

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | NO |  |
| `display_name` | text | YES |  |
| `is_organization` | boolean | YES | false |
| `parent_id` | bigint | YES |  |
| `email` | text | YES |  |
| `phone` | text | YES |  |
| `mobile` | text | YES |  |
| `website` | text | YES |  |
| `tax_id` | text | YES |  |
| `industry` | text | YES |  |
| `currency_code` | char(3) | YES |  |
| `lang` | text | YES | 'en'::text |
| `active` | boolean | YES | true |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `currency_code` -> `currencies`.`code`
- `organization_id` -> `organizations`.`id`
- `parent_id` -> `contacts`.`id`

### cost_centers

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `code` | text | YES |  |
| `active` | boolean | YES | true |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`

### cost_layers

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `movement_id` | bigint | YES |  |
| `item_id` | bigint | NO |  |
| `quantity` | numeric(18,4) | YES |  |
| `unit_cost` | numeric(18,4) | YES |  |
| `value` | numeric(18,4) | YES |  |
| `remaining_qty` | numeric(18,4) | YES |  |
| `remaining_value` | numeric(18,4) | YES |  |
| `journal_entry_id` | bigint | YES |  |
| `description` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `item_id` -> `item_variants`.`id`

### countries

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `code` | char(2) | NO |  |
| `name` | text | NO |  |
| `currency_code` | char(3) | NO |  |
| `timezone` | text | NO |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `currency_code` -> `currencies`.`code`

### coupons

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `code` | text | YES |  |
| `discount_type` | text | YES |  |
| `discount_value` | numeric(18,4) | YES |  |
| `price_rule_id` | bigint | YES |  |
| `usage_limit` | integer | YES |  |
| `used_count` | integer | YES | 0 |
| `expiry_date` | date | YES |  |
| `active` | boolean | NO | true |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`
- `price_rule_id` -> `price_rules`.`id`

### currencies

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('currencies_id_seq'::regclass) |
| `code` | char(3) | NO |  |
| `name` | text | NO |  |
| `symbol` | text | YES |  |
| `decimal_places` | smallint | YES | 2 |
| `rounding` | numeric(12,6) | YES | 0.01 |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

### deferred_schedule_lines

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `schedule_id` | bigint | YES |  |
| `sequence` | integer | YES |  |
| `recognition_date` | date | YES |  |
| `amount` | numeric(18,4) | YES |  |
| `entry_id` | bigint | YES |  |
| `posted` | boolean | YES | false |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `schedule_id` -> `deferred_schedules`.`id`

### deferred_schedules

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `type` | text | YES |  |
| `source_type` | text | YES |  |
| `source_id` | bigint | YES |  |
| `contact_id` | bigint | YES |  |
| `item_id` | bigint | YES |  |
| `total_amount` | numeric(18,4) | YES |  |
| `recognized_amount` | numeric(18,4) | YES | 0 |
| `balance_sheet_account_id` | bigint | YES |  |
| `pl_account_id` | bigint | YES |  |
| `method` | text | YES |  |
| `date_start` | date | YES |  |
| `date_end` | date | YES |  |
| `periods` | integer | YES |  |
| `state` | text | YES |  |
| `dimension_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `balance_sheet_account_id` -> `accounts`.`id`
- `contact_id` -> `contacts`.`id`
- `dimension_id` -> `dimensions`.`id`
- `item_id` -> `item_variants`.`id`
- `organization_id` -> `organizations`.`id`
- `pl_account_id` -> `accounts`.`id`

### demand_plans

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `item_id` | bigint | YES |  |
| `warehouse_id` | bigint | YES |  |
| `period_start` | date | YES |  |
| `period_end` | date | YES |  |
| `forecast_qty` | numeric(18,4) | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `item_id` -> `item_variants`.`id`
- `organization_id` -> `organizations`.`id`
- `warehouse_id` -> `warehouses`.`id`

### departments

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `description` | text | YES |  |
| `parent_id` | bigint | YES |  |
| `manager_id` | bigint | YES |  |
| `dimension_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `dimension_id` -> `dimensions`.`id`
- `organization_id` -> `organizations`.`id`
- `parent_id` -> `departments`.`id`

### dimension_distributions

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `journal_line_id` | bigint | NO |  |
| `dimension_id` | bigint | NO |  |
| `percent` | numeric(5,2) | NO |  |
| `amount` | numeric(18,4) | NO |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `dimension_id` -> `dimensions`.`id`

### dimensions

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | NO |  |
| `code` | text | YES |  |
| `kind` | text | YES |  |
| `parent_id` | bigint | YES |  |
| `active` | boolean | YES | true |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`
- `parent_id` -> `dimensions`.`id`

### doc_sequences

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `code` | text | YES |  |
| `prefix` | text | YES |  |
| `suffix` | text | YES |  |
| `next_number` | bigint | YES | 1 |
| `padding` | integer | YES | 5 |
| `reset_period` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`

### down_payment_links

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `advance_invoice_id` | bigint | NO |  |
| `final_invoice_id` | bigint | NO |  |
| `amount` | numeric(18,4) | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `advance_invoice_id` -> `invoices`.`id`
- `final_invoice_id` -> `invoices`.`id`
- `organization_id` -> `organizations`.`id`

### dropship_links

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `sale_order_line_id` | bigint | YES |  |
| `purchase_order_line_id` | bigint | YES |  |
| `stock_movement_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `purchase_order_line_id` -> `purchase_order_lines`.`id`
- `sale_order_line_id` -> `sale_order_lines`.`id`

### employees

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `contact_id` | bigint | YES |  |
| `user_id` | bigint | YES |  |
| `employee_number` | text | YES |  |
| `department_id` | bigint | YES |  |
| `job_position_id` | bigint | YES |  |
| `manager_id` | bigint | YES |  |
| `hire_date` | date | YES |  |
| `termination_date` | date | YES |  |
| `employment_type` | text | YES |  |
| `work_location` | text | YES |  |
| `active` | boolean | YES | true |
| `requires_approval` | boolean | NO | false |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `contact_id` -> `contacts`.`id`
- `department_id` -> `departments`.`id`
- `job_position_id` -> `job_positions`.`id`
- `manager_id` -> `employees`.`id`
- `organization_id` -> `organizations`.`id`
- `user_id` -> `users`.`id`

### employment_contracts

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `employee_id` | bigint | YES |  |
| `date_start` | date | YES |  |
| `date_end` | date | YES |  |
| `wage` | numeric(18,4) | YES |  |
| `wage_type` | text | YES |  |
| `currency_code` | char(3) | YES |  |
| `state` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `currency_code` -> `currencies`.`code`
- `employee_id` -> `employees`.`id`

### equipments

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `item_id` | bigint | YES |  |
| `serial_batch_id` | bigint | YES |  |
| `owner_contact_id` | bigint | YES |  |
| `fixed_asset_id` | bigint | YES |  |
| `location` | text | YES |  |
| `install_date` | date | YES |  |
| `warranty_end` | date | YES |  |
| `category` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `fixed_asset_id` -> `fixed_assets`.`id`
- `item_id` -> `item_variants`.`id`
- `organization_id` -> `organizations`.`id`
- `owner_contact_id` -> `contacts`.`id`
- `serial_batch_id` -> `batches`.`id`

### expense_categories

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `expense_account_id` | bigint | YES |  |
| `default_tax_ids` | int8[] | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `expense_account_id` -> `accounts`.`id`
- `organization_id` -> `organizations`.`id`

### expense_lines

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `report_id` | bigint | YES |  |
| `employee_id` | bigint | YES |  |
| `category_id` | bigint | YES |  |
| `item_id` | bigint | YES |  |
| `description` | text | YES |  |
| `expense_date` | date | YES |  |
| `quantity` | numeric(18,4) | YES | 1 |
| `unit_price` | numeric(18,4) | YES |  |
| `amount` | numeric(18,4) | YES |  |
| `tax_ids` | int8[] | YES |  |
| `currency_code` | char(3) | YES |  |
| `dimension_id` | bigint | YES |  |
| `project_id` | bigint | YES |  |
| `reimbursable` | boolean | YES | true |
| `receipt_attachment_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `category_id` -> `expense_categories`.`id`
- `currency_code` -> `currencies`.`code`
- `dimension_id` -> `dimensions`.`id`
- `employee_id` -> `employees`.`id`
- `item_id` -> `item_variants`.`id`
- `project_id` -> `projects`.`id`
- `receipt_attachment_id` -> `attachments`.`id`
- `report_id` -> `expense_reports`.`id`

### expense_reports

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `employee_id` | bigint | NO |  |
| `state` | text | YES |  |
| `payment_mode` | text | YES |  |
| `total_amount` | numeric(18,4) | YES |  |
| `entry_id` | bigint | YES |  |
| `reimbursement_entry_id` | bigint | YES |  |
| `submitted_at` | timestamp | YES |  |
| `approved_by` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `employee_id` -> `employees`.`id`
- `organization_id` -> `organizations`.`id`

### fixed_assets

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `category_id` | bigint | YES |  |
| `purchase_value` | numeric(18,4) | YES |  |
| `salvage_value` | numeric(18,4) | YES | 0 |
| `acquisition_date` | date | YES |  |
| `in_service_date` | date | YES |  |
| `original_entry_id` | bigint | YES |  |
| `invoice_line_id` | bigint | YES |  |
| `state` | text | YES |  |
| `disposal_date` | date | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `category_id` -> `asset_categories`.`id`
- `invoice_line_id` -> `invoice_lines`.`id`
- `organization_id` -> `organizations`.`id`

### fx_rates

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `currency_code` | char(3) | NO |  |
| `organization_id` | bigint | YES |  |
| `rate` | numeric(18,8) | NO |  |
| `rate_type` | text | YES | 'spot'::text |
| `valid_from` | date | NO |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `currency_code` -> `currencies`.`code`
- `organization_id` -> `organizations`.`id`

### fx_revaluation_lines

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('fx_revaluation_lines_id_seq'::regclass) |
| `revaluation_id` | bigint | NO |  |
| `account_id` | bigint | NO |  |
| `currency_code` | char(3) | NO |  |
| `foreign_balance` | numeric(18,4) | NO | 0 |
| `base_balance` | numeric(18,4) | NO | 0 |
| `closing_rate` | numeric(18,8) | NO | 0 |
| `gain_loss` | numeric(18,4) | NO | 0 |
| `entry_id` | bigint | YES |  |
| `reversed` | boolean | NO | false |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |
| `deleted_at` | timestamptz | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `account_id` -> `accounts`.`id`
- `revaluation_id` -> `fx_revaluations`.`id`

### fx_revaluations

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('fx_revaluations_id_seq'::regclass) |
| `organization_id` | bigint | NO |  |
| `period_id` | bigint | NO |  |
| `name` | text | YES |  |
| `date` | date | NO |  |
| `state` | text | NO | 'posted'::text |
| `total_gain_loss` | numeric(18,4) | NO | 0 |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |
| `deleted_at` | timestamptz | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`
- `period_id` -> `tax_periods`.`id`

### gift_card_transactions

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `gift_card_id` | bigint | YES |  |
| `type` | text | YES |  |
| `amount` | numeric(18,4) | YES |  |
| `order_type` | text | YES |  |
| `order_id` | bigint | YES |  |
| `entry_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `gift_card_id` -> `gift_cards`.`id`

### gift_cards

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `code` | text | YES |  |
| `contact_id` | bigint | YES |  |
| `initial_amount` | numeric(18,4) | YES |  |
| `balance` | numeric(18,4) | YES |  |
| `currency_code` | char(3) | YES |  |
| `expiry_date` | date | YES |  |
| `state` | text | YES |  |
| `issued_from_order_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `contact_id` -> `contacts`.`id`
- `currency_code` -> `currencies`.`code`
- `organization_id` -> `organizations`.`id`

### idempotency_keys

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `key` | text | YES |  |
| `resource` | text | YES |  |
| `status_code` | integer | YES |  |
| `response` | jsonb | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |
| `expires_at` | timestamp | NO | (CURRENT_TIMESTAMP + '24:00:00'::interval) |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`

### inbound_cost_adjustments

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `inbound_cost_id` | bigint | YES |  |
| `stock_movement_id` | bigint | YES |  |
| `item_id` | bigint | YES |  |
| `additional_cost` | numeric(18,4) | YES |  |
| `cost_layer_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `cost_layer_id` -> `cost_layers`.`id`
- `inbound_cost_id` -> `inbound_costs`.`id`
- `item_id` -> `item_variants`.`id`

### inbound_cost_lines

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `inbound_cost_id` | bigint | YES |  |
| `item_id` | bigint | YES |  |
| `description` | text | YES |  |
| `amount` | numeric(18,4) | YES |  |
| `supplier_bill_line_id` | bigint | YES |  |
| `split_method` | text | YES |  |
| `account_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `account_id` -> `accounts`.`id`
- `inbound_cost_id` -> `inbound_costs`.`id`
- `item_id` -> `item_variants`.`id`
- `supplier_bill_line_id` -> `invoice_lines`.`id`

### inbound_costs

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `date` | date | YES |  |
| `state` | text | YES |  |
| `target_shipment_ids` | int8[] | YES |  |
| `movement_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`

### integration_events

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `topic` | text | YES |  |
| `payload` | jsonb | YES |  |
| `status` | text | YES |  |
| `retries` | integer | YES | 0 |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

### interorganization_rules

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `from_organization_id` | bigint | YES |  |
| `to_organization_id` | bigint | YES |  |
| `auto_mirror` | boolean | YES | true |
| `supplier_contact_id` | bigint | YES |  |
| `customer_contact_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `customer_contact_id` -> `contacts`.`id`
- `from_organization_id` -> `organizations`.`id`
- `supplier_contact_id` -> `contacts`.`id`
- `to_organization_id` -> `organizations`.`id`

### interorganization_transactions

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `source_organization_id` | bigint | YES |  |
| `source_type` | text | YES |  |
| `source_id` | bigint | YES |  |
| `mirror_organization_id` | bigint | YES |  |
| `mirror_type` | text | YES |  |
| `mirror_id` | bigint | YES |  |
| `amount` | numeric(18,4) | YES |  |
| `state` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

### invoice_contra_settlements

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `customer_invoice_id` | bigint | NO |  |
| `supplier_bill_id` | bigint | NO |  |
| `amount` | numeric(18,4) | YES |  |
| `entry_id` | bigint | YES |  |
| `date` | date | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `customer_invoice_id` -> `invoices`.`id`
- `organization_id` -> `organizations`.`id`
- `supplier_bill_id` -> `invoices`.`id`

### invoice_credit_applications

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `invoice_id` | bigint | NO |  |
| `credit_note_id` | bigint | NO |  |
| `amount` | numeric(18,4) | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `credit_note_id` -> `invoices`.`id`
- `invoice_id` -> `invoices`.`id`
- `organization_id` -> `organizations`.`id`

### invoice_installments

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `invoice_id` | bigint | NO |  |
| `sequence` | integer | YES |  |
| `due_date` | date | YES |  |
| `amount` | numeric(18,4) | YES |  |
| `state` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `invoice_id` -> `invoices`.`id`
- `organization_id` -> `organizations`.`id`

### invoice_lines

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `invoice_id` | bigint | NO |  |
| `sequence` | integer | YES | 10 |
| `item_id` | bigint | YES |  |
| `description` | text | YES |  |
| `qty` | numeric(18,4) | YES |  |
| `unit_id` | bigint | YES |  |
| `unit_price` | numeric(18,4) | YES |  |
| `discount_pct` | numeric(8,4) | YES | 0 |
| `tax_ids` | int8[] | YES |  |
| `account_id` | bigint | YES |  |
| `dimension_id` | bigint | YES |  |
| `price_subtotal` | numeric(18,4) | YES |  |
| `sale_line_id` | bigint | YES |  |
| `purchase_line_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `account_id` -> `accounts`.`id`
- `dimension_id` -> `dimensions`.`id`
- `invoice_id` -> `invoices`.`id`
- `item_id` -> `item_variants`.`id`
- `purchase_line_id` -> `purchase_order_lines`.`id`
- `sale_line_id` -> `sale_order_lines`.`id`
- `unit_id` -> `units`.`id`

### invoice_taxes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `invoice_id` | bigint | YES |  |
| `tax_id` | bigint | YES |  |
| `base` | numeric(18,4) | YES |  |
| `amount` | numeric(18,4) | YES |  |
| `account_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `invoice_id` -> `invoices`.`id`
- `tax_id` -> `taxes`.`id`

### invoices

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `entry_id` | bigint | YES |  |
| `origin_invoice_id` | bigint | YES |  |
| `type` | text | YES |  |
| `contact_id` | bigint | NO |  |
| `name` | text | YES |  |
| `reference` | text | YES |  |
| `invoice_date` | date | YES |  |
| `due_date` | date | YES |  |
| `currency_code` | char(3) | YES |  |
| `journal_id` | bigint | YES |  |
| `payment_term_id` | bigint | YES |  |
| `tax_rule_id` | bigint | YES |  |
| `state` | text | YES |  |
| `payment_state` | text | YES |  |
| `amount_untaxed` | numeric(18,4) | YES | 0 |
| `amount_tax` | numeric(18,4) | YES | 0 |
| `amount_total` | numeric(18,4) | YES | 0 |
| `amount_residual` | numeric(18,4) | YES | 0 |
| `tax_rule` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |
| `is_advance` | boolean | NO | false |

**Primary key:** `id`

**Foreign keys:**

- `contact_id` -> `contacts`.`id`
- `currency_code` -> `currencies`.`code`
- `journal_id` -> `journals`.`id`
- `organization_id` -> `organizations`.`id`
- `origin_invoice_id` -> `invoices`.`id`
- `payment_term_id` -> `payment_terms`.`id`
- `tax_rule_id` -> `tax_rules`.`id`

### item_attribute_values

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `attribute_id` | bigint | YES |  |
| `value` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `attribute_id` -> `item_attributes`.`id`

### item_attributes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `name` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

### item_categories

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `name` | text | NO |  |
| `parent_id` | bigint | YES |  |
| `income_account_id` | bigint | YES |  |
| `expense_account_id` | bigint | YES |  |
| `stock_valuation_account_id` | bigint | YES |  |
| `stock_input_account_id` | bigint | YES |  |
| `stock_output_account_id` | bigint | YES |  |
| `cogs_account_id` | bigint | YES |  |
| `cost_method` | text | YES |  |
| `valuation` | text | YES |  |
| `organization_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `cogs_account_id` -> `accounts`.`id`
- `expense_account_id` -> `accounts`.`id`
- `income_account_id` -> `accounts`.`id`
- `organization_id` -> `organizations`.`id`
- `parent_id` -> `item_categories`.`id`
- `stock_input_account_id` -> `accounts`.`id`
- `stock_output_account_id` -> `accounts`.`id`
- `stock_valuation_account_id` -> `accounts`.`id`

### item_variants

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `item_id` | bigint | NO |  |
| `sku` | text | YES |  |
| `barcode` | text | YES |  |
| `attribute_json` | jsonb | YES |  |
| `extra_cost` | numeric(18,4) | YES | 0 |
| `active` | boolean | YES | true |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `item_id` -> `items`.`id`

### items

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | NO |  |
| `category_id` | bigint | YES |  |
| `type` | text | YES |  |
| `unit_id` | bigint | YES |  |
| `purchase_unit_id` | bigint | YES |  |
| `list_price` | numeric(18,4) | YES |  |
| `standard_cost` | numeric(18,4) | YES |  |
| `is_purchasable` | boolean | YES | true |
| `is_sellable` | boolean | YES | true |
| `is_manufactured` | boolean | YES | false |
| `tracking` | text | YES |  |
| `weight` | numeric(18,4) | YES |  |
| `volume` | numeric(18,4) | YES |  |
| `hs_code` | text | YES |  |
| `description_sale` | text | YES |  |
| `description_purchase` | text | YES |  |
| `active` | boolean | YES | true |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `category_id` -> `item_categories`.`id`
- `organization_id` -> `organizations`.`id`
- `purchase_unit_id` -> `units`.`id`
- `unit_id` -> `units`.`id`

### job_positions

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `name` | text | YES |  |
| `department_id` | bigint | YES |  |
| `organization_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `department_id` -> `departments`.`id`
- `organization_id` -> `organizations`.`id`

### job_runs

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('job_runs_id_seq'::regclass) |
| `job_type` | text | NO |  |
| `status` | text | YES |  |
| `processed` | integer | YES | 0 |
| `cursor` | bigint | YES |  |
| `error_message` | text | YES |  |
| `started_at` | timestamptz | NO | now() |
| `finished_at` | timestamptz | YES |  |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |
| `deleted_at` | timestamptz | YES |  |

**Primary key:** `id`

### journal_entrys

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | NO |  |
| `journal_id` | bigint | NO |  |
| `name` | text | YES |  |
| `date` | date | NO |  |
| `ref` | text | YES |  |
| `state` | text | YES |  |
| `currency_code` | char(3) | YES |  |
| `origin_type` | text | YES |  |
| `origin_id` | bigint | YES |  |
| `reversed_entry_id` | bigint | YES |  |
| `posted_at` | timestamp | YES |  |
| `posted_by` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `date`, `id`

**Foreign keys:**

- `currency_code` -> `currencies`.`code`
- `journal_id` -> `journals`.`id`
- `organization_id` -> `organizations`.`id`
- `posted_by` -> `users`.`id`

**Note:** This table is partitioned; child partitions are created per period.

### journal_lines

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `entry_id` | bigint | NO |  |
| `date` | date | NO |  |
| `account_id` | bigint | NO |  |
| `contact_id` | bigint | YES |  |
| `name` | text | YES |  |
| `debit` | numeric(18,4) | YES | 0 |
| `credit` | numeric(18,4) | YES | 0 |
| `currency_code` | char(3) | YES |  |
| `amount_currency` | numeric(18,4) | YES |  |
| `dimension_id` | bigint | YES |  |
| `tax_id` | bigint | YES |  |
| `reconciled` | boolean | YES | false |
| `full_reconcile_id` | bigint | YES |  |
| `due_date` | date | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `date`, `id`

**Foreign keys:**

- `account_id` -> `accounts`.`id`
- `contact_id` -> `contacts`.`id`
- `currency_code` -> `currencies`.`code`
- `dimension_id` -> `dimensions`.`id`
- `full_reconcile_id` -> `account_full_reconciles`.`id`
- `tax_id` -> `taxes`.`id`

**Note:** This table is partitioned; child partitions are created per period.

### journals

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | NO |  |
| `name` | text | NO |  |
| `code` | text | YES |  |
| `type` | text | YES |  |
| `default_account_id` | bigint | YES |  |
| `currency_code` | char(3) | YES |  |
| `bank_account_id` | bigint | YES |  |
| `sequence_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `bank_account_id` -> `contact_bank_accounts`.`id`
- `currency_code` -> `currencies`.`code`
- `default_account_id` -> `accounts`.`id`
- `organization_id` -> `organizations`.`id`
- `sequence_id` -> `doc_sequences`.`id`

### kpi_account_summaries

| Column | Type | Nullable | Default |
|---|---|---|---|
| `organization_id` | bigint | NO |  |
| `tax_period_id` | bigint | NO |  |
| `account_id` | bigint | NO |  |
| `opening_debit` | numeric(18,4) | NO | 0 |
| `opening_credit` | numeric(18,4) | NO | 0 |
| `period_debit` | numeric(18,4) | NO | 0 |
| `period_credit` | numeric(18,4) | NO | 0 |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |
| `deleted_at` | timestamptz | YES |  |

**Primary key:** `organization_id`, `tax_period_id`, `account_id`

### leave_requests

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `employee_id` | bigint | YES |  |
| `leave_type_id` | bigint | YES |  |
| `date_from` | date | YES |  |
| `date_to` | date | YES |  |
| `days` | numeric(6,2) | YES |  |
| `state` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `employee_id` -> `employees`.`id`
- `leave_type_id` -> `leave_types`.`id`

### leave_types

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `name` | text | YES |  |
| `paid` | boolean | YES |  |
| `allocation_days` | numeric(6,2) | YES |  |
| `organization_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`

### localization_profiles

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `name` | text | NO |  |
| `country_code` | char(2) | NO |  |
| `currency_code` | char(3) | NO |  |
| `locale` | text | YES | 'id-ID'::text |
| `timezone` | text | YES | 'UTC'::text |
| `date_format` | text | YES | 'DD/MM/YYYY'::text |
| `tax_year_start_month` | smallint | YES | 1 |
| `active` | boolean | NO | true |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

### localization_tax_template_lines

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `profile_id` | bigint | NO |  |
| `name` | text | NO |  |
| `kind` | text | YES |  |
| `rate` | numeric(8,4) | YES | 0 |
| `price_include` | boolean | NO | false |
| `tax_account_code` | text | YES |  |
| `sequence` | integer | YES | 0 |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `profile_id` -> `localization_profiles`.`id`

### maintenance_plans

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `equipment_id` | bigint | YES |  |
| `name` | text | YES |  |
| `interval_days` | integer | YES |  |
| `next_due` | date | YES |  |
| `active` | boolean | YES | true |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `equipment_id` -> `equipments`.`id`

### member_role_assignments

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `member_id` | bigint | NO |  |
| `role_id` | bigint | NO |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `member_id` -> `members`.`id`
- `role_id` -> `member_roles`.`id`

### member_role_permissions

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `member_role_id` | bigint | NO |  |
| `permission_id` | bigint | NO |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `member_role_id` -> `member_roles`.`id`
- `permission_id` -> `permissions`.`id`

### member_roles

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | NO |  |
| `name` | text | NO |  |
| `code` | text | NO |  |
| `description` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`

### members

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `user_id` | bigint | NO |  |
| `organization_id` | bigint | NO |  |
| `position` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`
- `user_id` -> `users`.`id`

### messages

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `owner_type` | text | YES |  |
| `owner_id` | bigint | YES |  |
| `author_id` | bigint | YES |  |
| `body` | text | YES |  |
| `message_type` | text | YES |  |
| `organization_id` | bigint | NO |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`

### organizations

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `name` | text | NO |  |
| `legal_name` | text | YES |  |
| `parent_id` | bigint | YES |  |
| `base_currency` | char(3) | NO |  |
| `country_code` | char(2) | YES |  |
| `tax_id` | text | YES |  |
| `address` | text | YES |  |
| `city` | text | YES |  |
| `postal_code` | text | YES |  |
| `logo` | text | YES |  |
| `timezone` | text | YES | 'UTC'::text |
| `tax_year_start_month` | smallint | YES | 1 |
| `auto_checkout_hour` | smallint | YES |  |
| `rounding_minutes` | smallint | YES | 0 |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `parent_id` -> `organizations`.`id`

### outside_processing_orders

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `production_order_id` | bigint | YES |  |
| `supplier_id` | bigint | YES |  |
| `purchase_order_id` | bigint | YES |  |
| `state` | text | NO | 'draft'::text |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `production_order_id` -> `production_orders`.`id`
- `purchase_order_id` -> `purchase_orders`.`id`
- `supplier_id` -> `contacts`.`id`

### payment_allocations

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `payment_id` | bigint | YES |  |
| `invoice_id` | bigint | YES |  |
| `amount` | numeric(18,4) | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `invoice_id` -> `invoices`.`id`
- `payment_id` -> `payments`.`id`

### payment_batch_lines

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `batch_id` | bigint | NO |  |
| `order_id` | bigint | NO |  |
| `amount` | numeric(18,4) | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `batch_id` -> `payment_batches`.`id`
- `order_id` -> `purchase_orders`.`id`

### payment_batches

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `journal_id` | bigint | NO |  |
| `contact_id` | bigint | NO |  |
| `date` | date | YES |  |
| `state` | text | YES |  |
| `total_amount` | numeric(18,4) | YES | 0 |
| `payment_count` | integer | YES | 0 |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `contact_id` -> `contacts`.`id`
- `journal_id` -> `journals`.`id`
- `organization_id` -> `organizations`.`id`

### payment_term_lines

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `payment_term_id` | bigint | NO |  |
| `sequence` | integer | YES | 10 |
| `value_type` | text | YES |  |
| `value` | numeric(12,4) | YES |  |
| `days_after` | integer | YES | 0 |
| `day_of_month` | integer | YES |  |
| `discount_pct` | numeric(8,4) | YES |  |
| `discount_days` | integer | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `payment_term_id` -> `payment_terms`.`id`

### payment_terms

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `name` | text | NO |  |
| `note` | text | YES |  |
| `organization_id` | bigint | NO |  |
| `code` | text | YES |  |
| `is_active` | boolean | YES | true |
| `template_key` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`

### payments

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `contact_id` | bigint | YES |  |
| `type` | text | YES |  |
| `journal_id` | bigint | YES |  |
| `payment_method` | text | YES |  |
| `amount` | numeric(18,4) | NO |  |
| `currency_code` | char(3) | YES |  |
| `date` | date | NO |  |
| `reference` | text | YES |  |
| `entry_id` | bigint | YES |  |
| `contact_bank_account_id` | bigint | YES |  |
| `state` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `contact_bank_account_id` -> `contact_bank_accounts`.`id`
- `contact_id` -> `contacts`.`id`
- `currency_code` -> `currencies`.`code`
- `journal_id` -> `journals`.`id`
- `organization_id` -> `organizations`.`id`

### payroll_runs

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `period_start` | date | YES |  |
| `period_end` | date | YES |  |
| `state` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`

### payslip_lines

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `payslip_id` | bigint | YES |  |
| `rule_id` | bigint | YES |  |
| `code` | text | YES |  |
| `name` | text | YES |  |
| `category` | text | YES |  |
| `amount` | numeric(18,4) | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `payslip_id` -> `payslips`.`id`
- `rule_id` -> `salary_rules`.`id`

### payslips

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `run_id` | bigint | YES |  |
| `employee_id` | bigint | YES |  |
| `contract_id` | bigint | YES |  |
| `gross` | numeric(18,4) | YES |  |
| `net` | numeric(18,4) | YES |  |
| `entry_id` | bigint | YES |  |
| `state` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `contract_id` -> `employment_contracts`.`id`
- `employee_id` -> `employees`.`id`
- `run_id` -> `payroll_runs`.`id`

### pdc_instruments

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `contact_id` | bigint | NO |  |
| `direction` | text | YES |  |
| `number` | text | YES |  |
| `bank_name` | text | YES |  |
| `amount` | numeric(18,4) | YES |  |
| `currency_code` | char(3) | YES |  |
| `due_date` | date | YES |  |
| `state` | text | YES |  |
| `invoice_id` | bigint | YES |  |
| `payment_id` | bigint | YES |  |
| `journal_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `contact_id` -> `contacts`.`id`
- `invoice_id` -> `invoices`.`id`
- `journal_id` -> `journals`.`id`
- `organization_id` -> `organizations`.`id`
- `payment_id` -> `payments`.`id`

### period_close_entries

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | NO |  |
| `period_id` | bigint | NO |  |
| `entry_id` | bigint | YES |  |
| `closing_date` | date | NO |  |
| `state` | text | YES |  |
| `posted_at` | timestamp | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`
- `period_id` -> `tax_periods`.`id`

### permissions

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `name` | text | NO |  |
| `code` | text | NO |  |
| `description` | text | YES |  |
| `action` | text | NO |  |
| `resource` | text | NO |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

### pipeline_stages

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `name` | text | YES |  |
| `sequence` | integer | YES |  |
| `is_won` | boolean | YES | false |
| `probability` | numeric(5,2) | YES |  |
| `organization_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |
| `is_lost` | boolean | NO | false |
| `exit_criteria` | text | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`

### planned_supplies

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `planning_run_id` | bigint | YES |  |
| `item_id` | bigint | YES |  |
| `warehouse_id` | bigint | YES |  |
| `src_warehouse_id` | bigint | YES |  |
| `type` | text | YES |  |
| `qty` | numeric(18,4) | YES |  |
| `order_date` | date | YES |  |
| `due_date` | date | YES |  |
| `pegged_demand_id` | bigint | YES |  |
| `confirmed` | boolean | YES | false |
| `generated_doc_type` | text | YES |  |
| `generated_doc_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `item_id` -> `item_variants`.`id`
- `pegged_demand_id` -> `planning_needs`.`id`
- `planning_run_id` -> `planning_runs`.`id`
- `src_warehouse_id` -> `warehouses`.`id`
- `warehouse_id` -> `warehouses`.`id`

### planning_needs

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `planning_run_id` | bigint | YES |  |
| `item_id` | bigint | YES |  |
| `warehouse_id` | bigint | YES |  |
| `source_type` | text | YES |  |
| `source_id` | bigint | YES |  |
| `qty` | numeric(18,4) | YES |  |
| `required_date` | date | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `item_id` -> `item_variants`.`id`
- `planning_run_id` -> `planning_runs`.`id`
- `warehouse_id` -> `warehouses`.`id`

### planning_runs

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `run_date` | date | YES |  |
| `horizon_days` | integer | YES |  |
| `state` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`

### pos_configs

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `warehouse_id` | bigint | YES |  |
| `journal_id` | bigint | YES |  |
| `price_book_id` | bigint | YES |  |
| `discount_account_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `discount_account_id` -> `accounts`.`id`
- `journal_id` -> `journals`.`id`
- `organization_id` -> `organizations`.`id`
- `price_book_id` -> `price_books`.`id`
- `warehouse_id` -> `warehouses`.`id`

### pos_order_lines

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `order_id` | bigint | YES |  |
| `item_id` | bigint | YES |  |
| `qty` | numeric(18,4) | YES |  |
| `unit_price` | numeric(18,4) | YES |  |
| `discount_pct` | numeric(8,4) | YES |  |
| `tax_ids` | int8[] | YES |  |
| `price_subtotal` | numeric(18,4) | YES |  |
| `price_tax` | numeric(18,4) | YES | 0 |
| `price_total` | numeric(18,4) | YES | 0 |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `item_id` -> `item_variants`.`id`
- `order_id` -> `pos_orders`.`id`

### pos_orders

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `session_id` | bigint | YES |  |
| `contact_id` | bigint | YES |  |
| `name` | text | YES |  |
| `amount_total` | numeric(18,4) | YES |  |
| `amount_tax` | numeric(18,4) | YES |  |
| `state` | text | YES |  |
| `invoice_id` | bigint | YES |  |
| `order_time` | timestamp | YES |  |
| `coupon_discount` | numeric(18,4) | NO | 0 |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `contact_id` -> `contacts`.`id`
- `invoice_id` -> `invoices`.`id`
- `session_id` -> `pos_sessions`.`id`

### pos_payment_accounts

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | NO |  |
| `method` | text | NO |  |
| `account_id` | bigint | NO |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `account_id` -> `accounts`.`id`
- `organization_id` -> `organizations`.`id`

### pos_payments

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `order_id` | bigint | YES |  |
| `method` | text | YES |  |
| `amount` | numeric(18,4) | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `order_id` -> `pos_orders`.`id`

### pos_sessions

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `config_id` | bigint | YES |  |
| `cashier_id` | bigint | YES |  |
| `opened_at` | timestamp | YES |  |
| `closed_at` | timestamp | YES |  |
| `opening_balance` | numeric(18,4) | YES |  |
| `closing_balance` | numeric(18,4) | YES |  |
| `expected_cash` | numeric(18,4) | YES |  |
| `variance` | numeric(18,4) | YES |  |
| `state` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `cashier_id` -> `users`.`id`
- `config_id` -> `pos_configs`.`id`

### price_books

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `name` | text | NO |  |
| `currency_code` | char(3) | YES |  |
| `organization_id` | bigint | YES |  |
| `active` | boolean | YES | true |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `currency_code` -> `currencies`.`code`
- `organization_id` -> `organizations`.`id`

### price_rules

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `price_book_id` | bigint | YES |  |
| `applies_to` | text | YES |  |
| `item_id` | bigint | YES |  |
| `category_id` | bigint | YES |  |
| `min_qty` | numeric(18,4) | YES | 0 |
| `compute_type` | text | YES |  |
| `fixed_price` | numeric(18,4) | YES |  |
| `discount_pct` | numeric(8,4) | YES |  |
| `date_start` | date | YES |  |
| `date_end` | date | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `category_id` -> `item_categories`.`id`
- `item_id` -> `item_variants`.`id`
- `price_book_id` -> `price_books`.`id`

### production_orders

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `item_id` | bigint | NO |  |
| `recipe_id` | bigint | YES |  |
| `qty_to_produce` | numeric(18,4) | NO |  |
| `qty_produced` | numeric(18,4) | YES | 0 |
| `unit_id` | bigint | YES |  |
| `src_location_id` | bigint | YES |  |
| `dst_location_id` | bigint | YES |  |
| `state` | text | YES |  |
| `date_planned_start` | timestamp | YES |  |
| `date_planned_finish` | timestamp | YES |  |
| `date_start` | timestamp | YES |  |
| `date_finished` | timestamp | YES |  |
| `origin` | text | YES |  |
| `priority` | smallint | YES | 0 |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `dst_location_id` -> `stock_locations`.`id`
- `item_id` -> `item_variants`.`id`
- `organization_id` -> `organizations`.`id`
- `recipe_id` -> `recipes`.`id`
- `src_location_id` -> `stock_locations`.`id`
- `unit_id` -> `units`.`id`

### production_steps

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `recipe_id` | bigint | YES |  |
| `work_center_id` | bigint | YES |  |
| `name` | text | YES |  |
| `sequence` | integer | YES |  |
| `setup_minutes` | numeric(12,2) | YES | 0 |
| `time_minutes` | numeric(12,2) | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `recipe_id` -> `recipes`.`id`
- `work_center_id` -> `work_centers`.`id`

### project_invoice_lines

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `project_id` | bigint | YES |  |
| `invoice_id` | bigint | YES |  |
| `invoice_line_id` | bigint | YES |  |
| `timesheet_id` | bigint | YES |  |
| `qty` | numeric(18,4) | YES |  |
| `unit_price` | numeric(18,4) | YES |  |
| `amount` | numeric(18,4) | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `invoice_id` -> `invoices`.`id`
- `project_id` -> `projects`.`id`
- `timesheet_id` -> `timesheets`.`id`

### project_milestones

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `project_id` | bigint | YES |  |
| `name` | text | YES |  |
| `deadline` | date | YES |  |
| `reached` | boolean | YES | false |
| `sale_line_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `project_id` -> `projects`.`id`
- `sale_line_id` -> `sale_order_lines`.`id`

### project_tasks

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `project_id` | bigint | YES |  |
| `name` | text | YES |  |
| `assignee_id` | bigint | YES |  |
| `stage` | text | YES |  |
| `planned_hours` | numeric(8,2) | YES |  |
| `effective_hours` | numeric(8,2) | YES |  |
| `parent_task_id` | bigint | YES |  |
| `deadline` | date | YES |  |
| `priority` | smallint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `assignee_id` -> `users`.`id`
- `parent_task_id` -> `project_tasks`.`id`
- `project_id` -> `projects`.`id`

### projects

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `contact_id` | bigint | YES |  |
| `manager_id` | bigint | YES |  |
| `dimension_id` | bigint | YES |  |
| `sale_order_id` | bigint | YES |  |
| `billing_type` | text | YES |  |
| `billable_rate` | numeric(18,4) | YES |  |
| `date_start` | date | YES |  |
| `date_end` | date | YES |  |
| `state` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `contact_id` -> `contacts`.`id`
- `dimension_id` -> `dimensions`.`id`
- `organization_id` -> `organizations`.`id`
- `sale_order_id` -> `sale_orders`.`id`

### prospect_activities

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `lead_id` | bigint | YES |  |
| `contact_id` | bigint | YES |  |
| `type` | text | YES |  |
| `summary` | text | YES |  |
| `note` | text | YES |  |
| `due_date` | timestamp | YES |  |
| `done` | boolean | YES | false |
| `done_at` | timestamp | YES |  |
| `user_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |
| `outcome` | text | YES |  |
| `next_step` | text | YES |  |
| `next_step_due` | date | YES |  |
| `participants` | text | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `contact_id` -> `contacts`.`id`
- `lead_id` -> `prospects`.`id`
- `user_id` -> `users`.`id`

### prospect_contacts

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `prospect_id` | bigint | NO |  |
| `contact_id` | bigint | NO |  |
| `role` | text | NO | 'influencer'::text |
| `is_primary` | boolean | NO | false |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `contact_id` -> `contacts`.`id`
- `prospect_id` -> `prospects`.`id`

### prospect_stage_histories

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `prospect_id` | bigint | NO |  |
| `from_stage_id` | bigint | YES |  |
| `to_stage_id` | bigint | YES |  |
| `from_status` | text | YES |  |
| `to_status` | text | YES |  |
| `probability` | numeric(5,2) | YES |  |
| `notes` | text | YES |  |
| `actor_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `actor_id` -> `users`.`id`
- `from_stage_id` -> `pipeline_stages`.`id`
- `prospect_id` -> `prospects`.`id`
- `to_stage_id` -> `pipeline_stages`.`id`

### prospects

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | NO |  |
| `type` | text | YES |  |
| `contact_id` | bigint | YES |  |
| `contact_name` | text | YES |  |
| `email` | text | YES |  |
| `phone` | text | YES |  |
| `job_position` | text | YES |  |
| `stage_id` | bigint | YES |  |
| `expected_revenue` | numeric(18,4) | YES |  |
| `probability` | numeric(5,2) | YES |  |
| `priority` | smallint | YES | 0 |
| `salesperson_id` | bigint | YES |  |
| `sales_group_id` | bigint | YES |  |
| `source` | text | YES |  |
| `medium` | text | YES |  |
| `campaign` | text | YES |  |
| `lost_reason` | text | YES |  |
| `expected_close` | date | YES |  |
| `closed_at` | timestamp | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |
| `status` | text | NO | 'new'::text |
| `temperature` | text | NO | 'warm'::text |
| `need_summary` | text | YES |  |
| `budget_amount` | numeric(18,4) | YES |  |
| `budget_confirmed` | boolean | NO | false |
| `authority_confirmed` | boolean | NO | false |
| `timeline_date` | date | YES |  |
| `fit_score` | smallint | NO | 0 |
| `intent_score` | smallint | NO | 0 |
| `lead_score` | smallint | NO | 0 |
| `qualification_notes` | text | YES |  |
| `decision_criteria` | text | YES |  |
| `competition` | text | YES |  |
| `proposed_solution` | text | YES |  |
| `next_step` | text | YES |  |
| `next_step_due` | date | YES |  |
| `forecast_category` | text | NO | 'pipeline'::text |
| `currency_code` | text | NO | 'IDR'::text |
| `consent_granted` | boolean | NO | false |
| `consent_source` | text | YES |  |
| `consent_at` | timestamp | YES |  |
| `do_not_contact` | boolean | NO | false |
| `first_contacted_at` | timestamp | YES |  |
| `qualified_at` | timestamp | YES |  |
| `converted_at` | timestamp | YES |  |
| `stage_entered_at` | timestamp | YES |  |
| `last_activity_at` | timestamp | YES |  |
| `owner_user_id` | bigint | YES |  |
| `lost_reason_code` | text | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `contact_id` -> `contacts`.`id`
- `organization_id` -> `organizations`.`id`
- `owner_user_id` -> `users`.`id`
- `sales_group_id` -> `sales_groups`.`id`
- `salesperson_id` -> `contacts`.`id`
- `stage_id` -> `pipeline_stages`.`id`

### purchase_credit_memos

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `order_id` | bigint | NO |  |
| `journal_id` | bigint | NO |  |
| `contact_id` | bigint | NO |  |
| `date` | date | YES |  |
| `state` | text | YES |  |
| `amount_untaxed` | numeric(18,4) | YES | 0 |
| `amount_tax` | numeric(18,4) | YES | 0 |
| `amount_total` | numeric(18,4) | YES | 0 |
| `reason` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `contact_id` -> `contacts`.`id`
- `journal_id` -> `journals`.`id`
- `order_id` -> `purchase_orders`.`id`

### purchase_debit_memos

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `order_id` | bigint | NO |  |
| `journal_id` | bigint | NO |  |
| `contact_id` | bigint | NO |  |
| `date` | date | YES |  |
| `state` | text | YES |  |
| `amount_untaxed` | numeric(18,4) | YES | 0 |
| `amount_tax` | numeric(18,4) | YES | 0 |
| `amount_total` | numeric(18,4) | YES | 0 |
| `reason` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `contact_id` -> `contacts`.`id`
- `journal_id` -> `journals`.`id`
- `order_id` -> `purchase_orders`.`id`

### purchase_order_lines

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `order_id` | bigint | NO |  |
| `sequence` | integer | YES | 10 |
| `item_id` | bigint | YES |  |
| `description` | text | YES |  |
| `qty_ordered` | numeric(18,4) | NO |  |
| `qty_received` | numeric(18,4) | YES | 0 |
| `qty_billed` | numeric(18,4) | YES | 0 |
| `qty_returns` | numeric(18,4) | YES | 0 |
| `unit_id` | bigint | YES |  |
| `unit_price` | numeric(18,4) | YES |  |
| `discount_pct` | numeric(8,4) | YES | 0 |
| `tax_ids` | int8[] | YES |  |
| `dimension_id` | bigint | YES |  |
| `cost_center_id` | bigint | YES |  |
| `price_subtotal` | numeric(18,4) | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `cost_center_id` -> `cost_centers`.`id`
- `dimension_id` -> `dimensions`.`id`
- `item_id` -> `item_variants`.`id`
- `order_id` -> `purchase_orders`.`id`
- `unit_id` -> `units`.`id`

### purchase_orders

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `supplier_id` | bigint | NO |  |
| `supplier_ref` | text | YES |  |
| `currency_code` | char(3) | YES |  |
| `warehouse_id` | bigint | YES |  |
| `dest_location_id` | bigint | YES |  |
| `state` | text | YES |  |
| `order_date` | date | YES |  |
| `expected_date` | date | YES |  |
| `payment_term_id` | bigint | YES |  |
| `incoterm` | text | YES |  |
| `amount_untaxed` | numeric(18,4) | YES | 0 |
| `amount_tax` | numeric(18,4) | YES | 0 |
| `amount_total` | numeric(18,4) | YES | 0 |
| `invoice_status` | text | YES |  |
| `receipt_status` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `currency_code` -> `currencies`.`code`
- `dest_location_id` -> `stock_locations`.`id`
- `organization_id` -> `organizations`.`id`
- `payment_term_id` -> `payment_terms`.`id`
- `supplier_id` -> `contacts`.`id`
- `warehouse_id` -> `warehouses`.`id`

### purchase_request_lines

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `request_id` | bigint | YES |  |
| `item_id` | bigint | YES |  |
| `description` | text | YES |  |
| `qty` | numeric(18,4) | YES |  |
| `unit_id` | bigint | YES |  |
| `needed_by` | date | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `item_id` -> `item_variants`.`id`
- `request_id` -> `purchase_requests`.`id`
- `unit_id` -> `units`.`id`

### purchase_requests

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `requester_id` | bigint | YES |  |
| `department_id` | bigint | YES |  |
| `state` | text | YES |  |
| `needed_by` | date | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`
- `requester_id` -> `contacts`.`id`

### quality_alerts

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `item_id` | bigint | YES |  |
| `batch_id` | bigint | YES |  |
| `check_id` | bigint | YES |  |
| `title` | text | YES |  |
| `description` | text | YES |  |
| `severity` | text | YES |  |
| `state` | text | YES |  |
| `assigned_to` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `assigned_to` -> `users`.`id`
- `batch_id` -> `batches`.`id`
- `check_id` -> `quality_checks`.`id`
- `item_id` -> `item_variants`.`id`

### quality_checks

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `point_id` | bigint | YES |  |
| `item_id` | bigint | YES |  |
| `batch_id` | bigint | YES |  |
| `shipment_id` | bigint | YES |  |
| `production_order_id` | bigint | YES |  |
| `measured_value` | numeric(18,4) | YES |  |
| `result` | text | YES |  |
| `checked_by` | bigint | YES |  |
| `checked_at` | timestamp | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `batch_id` -> `batches`.`id`
- `checked_by` -> `users`.`id`
- `item_id` -> `item_variants`.`id`
- `point_id` -> `quality_points`.`id`
- `production_order_id` -> `production_orders`.`id`
- `shipment_id` -> `shipments`.`id`

### quality_points

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `item_id` | bigint | YES |  |
| `operation` | text | YES |  |
| `test_type` | text | YES |  |
| `norm_min` | numeric(18,4) | YES |  |
| `norm_max` | numeric(18,4) | YES |  |
| `unit_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `item_id` -> `item_variants`.`id`
- `organization_id` -> `organizations`.`id`
- `unit_id` -> `units`.`id`

### recipe_lines

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `recipe_id` | bigint | NO |  |
| `component_id` | bigint | NO |  |
| `qty` | numeric(18,4) | NO |  |
| `unit_id` | bigint | YES |  |
| `scrap_pct` | numeric(8,4) | YES | 0 |
| `production_step_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `component_id` -> `item_variants`.`id`
- `production_step_id` -> `production_steps`.`id`
- `recipe_id` -> `recipes`.`id`
- `unit_id` -> `units`.`id`

### recipes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `item_id` | bigint | NO |  |
| `code` | text | YES |  |
| `qty` | numeric(18,4) | YES | 1 |
| `unit_id` | bigint | YES |  |
| `type` | text | YES |  |
| `version` | integer | YES | 1 |
| `active` | boolean | YES | true |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `item_id` -> `item_variants`.`id`
- `organization_id` -> `organizations`.`id`
- `unit_id` -> `units`.`id`

### reminder_actions

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `contact_id` | bigint | YES |  |
| `invoice_id` | bigint | YES |  |
| `level_id` | bigint | YES |  |
| `sent_at` | timestamp | YES |  |
| `channel` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `contact_id` -> `contacts`.`id`
- `invoice_id` -> `invoices`.`id`
- `level_id` -> `reminder_levels`.`id`

### reminder_levels

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `name` | text | YES |  |
| `days_overdue` | integer | YES |  |
| `sequence` | integer | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

### reorder_rules

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `item_id` | bigint | NO |  |
| `warehouse_id` | bigint | YES |  |
| `location_id` | bigint | YES |  |
| `min_qty` | numeric(18,4) | YES |  |
| `max_qty` | numeric(18,4) | YES |  |
| `qty_multiple` | numeric(18,4) | YES | 1 |
| `lead_time_days` | integer | YES |  |
| `active` | boolean | YES | true |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `item_id` -> `item_variants`.`id`
- `location_id` -> `stock_locations`.`id`
- `warehouse_id` -> `warehouses`.`id`

### rma_lines

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `rma_id` | bigint | YES |  |
| `item_id` | bigint | YES |  |
| `qty` | numeric(18,4) | YES |  |
| `batch_id` | bigint | YES |  |
| `disposition` | text | YES |  |
| `stock_movement_id` | bigint | YES |  |
| `credit_note_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `batch_id` -> `batches`.`id`
- `credit_note_id` -> `invoices`.`id`
- `item_id` -> `item_variants`.`id`
- `rma_id` -> `rmas`.`id`

### rmas

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `type` | text | YES |  |
| `contact_id` | bigint | YES |  |
| `origin_order_type` | text | YES |  |
| `origin_order_id` | bigint | YES |  |
| `reason` | text | YES |  |
| `state` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `contact_id` -> `contacts`.`id`
- `organization_id` -> `organizations`.`id`

### salary_rules

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `code` | text | YES |  |
| `name` | text | YES |  |
| `category` | text | YES |  |
| `compute_type` | text | YES |  |
| `amount` | numeric(18,4) | YES |  |
| `formula` | text | YES |  |
| `account_debit_id` | bigint | YES |  |
| `account_credit_id` | bigint | YES |  |
| `organization_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `account_credit_id` -> `accounts`.`id`
- `account_debit_id` -> `accounts`.`id`
- `organization_id` -> `organizations`.`id`

### sale_order_lines

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `order_id` | bigint | NO |  |
| `sequence` | integer | YES | 10 |
| `item_id` | bigint | YES |  |
| `description` | text | YES |  |
| `qty_ordered` | numeric(18,4) | NO |  |
| `qty_delivered` | numeric(18,4) | YES | 0 |
| `qty_invoiced` | numeric(18,4) | YES | 0 |
| `qty_returns` | numeric(18,4) | YES | 0 |
| `unit_id` | bigint | YES |  |
| `unit_price` | numeric(18,4) | YES |  |
| `discount_pct` | numeric(8,4) | YES | 0 |
| `tax_ids` | int8[] | YES |  |
| `dimension_id` | bigint | YES |  |
| `price_subtotal` | numeric(18,4) | YES |  |
| `price_tax` | numeric(18,4) | YES |  |
| `price_total` | numeric(18,4) | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `dimension_id` -> `dimensions`.`id`
- `item_id` -> `item_variants`.`id`
- `order_id` -> `sale_orders`.`id`
- `unit_id` -> `units`.`id`

### sale_orders

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `contact_id` | bigint | NO |  |
| `ship_address_id` | bigint | YES |  |
| `bill_address_id` | bigint | YES |  |
| `price_book_id` | bigint | YES |  |
| `currency_code` | char(3) | YES |  |
| `salesperson_id` | bigint | YES |  |
| `sales_group_id` | bigint | YES |  |
| `prospect_id` | bigint | YES |  |
| `warehouse_id` | bigint | YES |  |
| `state` | text | YES |  |
| `order_date` | date | YES |  |
| `expected_date` | date | YES |  |
| `validity_date` | date | YES |  |
| `payment_term_id` | bigint | YES |  |
| `incoterm` | text | YES |  |
| `customer_po_ref` | text | YES |  |
| `amount_untaxed` | numeric(18,4) | YES | 0 |
| `amount_tax` | numeric(18,4) | YES | 0 |
| `amount_total` | numeric(18,4) | YES | 0 |
| `invoice_status` | text | YES |  |
| `delivery_status` | text | YES |  |
| `note` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |
| `quote_id` | bigint | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `bill_address_id` -> `contact_addresses`.`id`
- `contact_id` -> `contacts`.`id`
- `currency_code` -> `currencies`.`code`
- `organization_id` -> `organizations`.`id`
- `payment_term_id` -> `payment_terms`.`id`
- `price_book_id` -> `price_books`.`id`
- `prospect_id` -> `prospects`.`id`
- `quote_id` -> `sale_quotes`.`id`
- `sales_group_id` -> `sales_groups`.`id`
- `salesperson_id` -> `contacts`.`id`
- `ship_address_id` -> `contact_addresses`.`id`
- `warehouse_id` -> `warehouses`.`id`

### sale_quote_lines

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `quote_id` | bigint | NO |  |
| `sequence` | integer | YES | 10 |
| `item_id` | bigint | YES |  |
| `description` | text | YES |  |
| `qty` | numeric(18,4) | NO |  |
| `unit_id` | bigint | YES |  |
| `unit_price` | numeric(18,4) | YES | 0 |
| `discount_pct` | numeric(8,4) | YES | 0 |
| `tax_ids` | int8[] | YES |  |
| `dimension_id` | bigint | YES |  |
| `price_subtotal` | numeric(18,4) | YES | 0 |
| `price_tax` | numeric(18,4) | YES | 0 |
| `price_total` | numeric(18,4) | YES | 0 |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `dimension_id` -> `dimensions`.`id`
- `item_id` -> `items`.`id`
- `quote_id` -> `sale_quotes`.`id`
- `unit_id` -> `units`.`id`

### sale_quotes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `contact_id` | bigint | NO |  |
| `price_book_id` | bigint | YES |  |
| `currency_code` | char(3) | YES |  |
| `salesperson_id` | bigint | YES |  |
| `sales_group_id` | bigint | YES |  |
| `prospect_id` | bigint | YES |  |
| `state` | text | YES |  |
| `quote_date` | date | YES |  |
| `validity_date` | date | YES |  |
| `payment_term_id` | bigint | YES |  |
| `incoterm` | text | YES |  |
| `customer_po_ref` | text | YES |  |
| `amount_untaxed` | numeric(18,4) | YES | 0 |
| `amount_tax` | numeric(18,4) | YES | 0 |
| `amount_total` | numeric(18,4) | YES | 0 |
| `version` | integer | NO | 1 |
| `root_quote_id` | bigint | YES |  |
| `previous_quote_id` | bigint | YES |  |
| `is_current` | boolean | NO | true |
| `accepted_at` | timestamp | YES |  |
| `sale_order_id` | bigint | YES |  |
| `note` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |
| `expected_revenue` | numeric(18,4) | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `contact_id` -> `contacts`.`id`
- `currency_code` -> `currencies`.`code`
- `organization_id` -> `organizations`.`id`
- `payment_term_id` -> `payment_terms`.`id`
- `previous_quote_id` -> `sale_quotes`.`id`
- `price_book_id` -> `price_books`.`id`
- `prospect_id` -> `prospects`.`id`
- `root_quote_id` -> `sale_quotes`.`id`
- `sale_order_id` -> `sale_orders`.`id`
- `sales_group_id` -> `sales_groups`.`id`
- `salesperson_id` -> `contacts`.`id`

### sales_groups

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `name` | text | YES |  |
| `leader_id` | bigint | YES |  |
| `organization_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `leader_id` -> `contacts`.`id`
- `organization_id` -> `organizations`.`id`

### service_contracts

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `contact_id` | bigint | YES |  |
| `equipment_id` | bigint | YES |  |
| `subscription_id` | bigint | YES |  |
| `coverage` | text | YES |  |
| `sla_response_hours` | integer | YES |  |
| `date_start` | date | YES |  |
| `date_end` | date | YES |  |
| `state` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `contact_id` -> `contacts`.`id`
- `equipment_id` -> `equipments`.`id`
- `organization_id` -> `organizations`.`id`
- `subscription_id` -> `subscriptions`.`id`

### service_order_lines

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `service_order_id` | bigint | YES |  |
| `type` | text | YES |  |
| `item_id` | bigint | YES |  |
| `description` | text | YES |  |
| `qty` | numeric(18,4) | YES |  |
| `unit_id` | bigint | YES |  |
| `unit_cost` | numeric(18,4) | YES |  |
| `unit_price` | numeric(18,4) | YES |  |
| `stock_movement_id` | bigint | YES |  |
| `billable` | boolean | YES | true |
| `covered_by_warranty` | boolean | YES | false |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `item_id` -> `item_variants`.`id`
- `service_order_id` -> `service_orders`.`id`
- `unit_id` -> `units`.`id`

### service_orders

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `contact_id` | bigint | YES |  |
| `equipment_id` | bigint | YES |  |
| `contract_id` | bigint | YES |  |
| `type` | text | YES |  |
| `priority` | smallint | YES |  |
| `state` | text | YES |  |
| `scheduled_date` | timestamp | YES |  |
| `technician_id` | bigint | YES |  |
| `invoice_id` | bigint | YES |  |
| `dimension_id` | bigint | YES |  |
| `reported_issue` | text | YES |  |
| `resolution` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `contact_id` -> `contacts`.`id`
- `contract_id` -> `service_contracts`.`id`
- `dimension_id` -> `dimensions`.`id`
- `equipment_id` -> `equipments`.`id`
- `invoice_id` -> `invoices`.`id`
- `organization_id` -> `organizations`.`id`
- `technician_id` -> `employees`.`id`

### shift_assignments

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('shift_assignments_id_seq'::regclass) |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |
| `deleted_at` | timestamptz | YES |  |
| `employee_id` | bigint | NO |  |
| `shift_id` | bigint | NO |  |
| `date` | date | NO |  |

**Primary key:** `id`

**Foreign keys:**

- `employee_id` -> `employees`.`id`
- `shift_id` -> `shifts`.`id`

### shifts

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('shifts_id_seq'::regclass) |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |
| `deleted_at` | timestamptz | YES |  |
| `organization_id` | bigint | NO |  |
| `name` | varchar(100) | NO |  |
| `start_time` | varchar(5) | NO |  |
| `end_time` | varchar(5) | NO |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`

### shipments

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `type` | text | YES |  |
| `contact_id` | bigint | YES |  |
| `src_location_id` | bigint | YES |  |
| `dst_location_id` | bigint | YES |  |
| `state` | text | YES |  |
| `scheduled_date` | timestamp | YES |  |
| `date_done` | timestamp | YES |  |
| `origin` | text | YES |  |
| `carrier_id` | bigint | YES |  |
| `tracking_ref` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `carrier_id` -> `carriers`.`id`
- `contact_id` -> `contacts`.`id`
- `dst_location_id` -> `stock_locations`.`id`
- `organization_id` -> `organizations`.`id`
- `src_location_id` -> `stock_locations`.`id`

### shop_tasks

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `production_order_id` | bigint | NO |  |
| `production_step_id` | bigint | YES |  |
| `work_center_id` | bigint | NO |  |
| `name` | text | YES |  |
| `state` | text | YES |  |
| `sequence` | integer | YES |  |
| `planned_start` | timestamp | YES |  |
| `planned_finish` | timestamp | YES |  |
| `date_start` | timestamp | YES |  |
| `date_finished` | timestamp | YES |  |
| `planned_minutes` | numeric(12,2) | YES | 0 |
| `actual_minutes` | numeric(12,2) | YES | 0 |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`
- `production_order_id` -> `production_orders`.`id`
- `production_step_id` -> `production_steps`.`id`
- `work_center_id` -> `work_centers`.`id`

### stock_balances

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `item_id` | bigint | NO |  |
| `location_id` | bigint | NO |  |
| `batch_id` | bigint | YES |  |
| `quantity` | numeric(18,4) | YES | 0 |
| `reserved_qty` | numeric(18,4) | YES | 0 |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `batch_id` -> `batches`.`id`
- `item_id` -> `item_variants`.`id`
- `location_id` -> `stock_locations`.`id`
- `organization_id` -> `organizations`.`id`

### stock_count_lines

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `stock_count_id` | bigint | YES |  |
| `item_id` | bigint | YES |  |
| `batch_id` | bigint | YES |  |
| `theoretical_qty` | numeric(18,4) | YES |  |
| `counted_qty` | numeric(18,4) | YES |  |
| `diff_qty` | numeric(18,4) | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `batch_id` -> `batches`.`id`
- `item_id` -> `item_variants`.`id`
- `stock_count_id` -> `stock_counts`.`id`

### stock_counts

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `location_id` | bigint | YES |  |
| `state` | text | YES |  |
| `count_date` | date | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `location_id` -> `stock_locations`.`id`
- `organization_id` -> `organizations`.`id`

### stock_holds

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `movement_id` | bigint | YES |  |
| `balance_id` | bigint | YES |  |
| `qty` | numeric(18,4) | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |
| `production_order_id` | bigint | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `balance_id` -> `stock_balances`.`id`
- `production_order_id` -> `production_orders`.`id`

### stock_locations

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `warehouse_id` | bigint | YES |  |
| `name` | text | NO |  |
| `code` | text | YES |  |
| `parent_id` | bigint | YES |  |
| `usage` | text | YES |  |
| `barcode` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`
- `parent_id` -> `stock_locations`.`id`
- `warehouse_id` -> `warehouses`.`id`

### stock_movements

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `shipment_id` | bigint | YES |  |
| `item_id` | bigint | NO |  |
| `qty` | numeric(18,4) | NO |  |
| `unit_id` | bigint | YES |  |
| `src_location_id` | bigint | NO |  |
| `dst_location_id` | bigint | NO |  |
| `batch_id` | bigint | YES |  |
| `state` | text | YES |  |
| `unit_cost` | numeric(18,4) | YES |  |
| `origin_type` | text | YES |  |
| `origin_id` | bigint | YES |  |
| `scheduled_date` | timestamp | YES |  |
| `date_done` | timestamp | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Foreign keys:**

- `batch_id` -> `batches`.`id`
- `dst_location_id` -> `stock_locations`.`id`
- `item_id` -> `item_variants`.`id`
- `organization_id` -> `organizations`.`id`
- `shipment_id` -> `shipments`.`id`
- `src_location_id` -> `stock_locations`.`id`
- `unit_id` -> `units`.`id`

**Note:** This table is partitioned; child partitions are created per period.

### subscription_lines

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `subscription_id` | bigint | YES |  |
| `item_id` | bigint | YES |  |
| `qty` | numeric(18,4) | YES |  |
| `unit_price` | numeric(18,4) | YES |  |
| `discount_pct` | numeric(8,4) | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `item_id` -> `item_variants`.`id`
- `subscription_id` -> `subscriptions`.`id`

### subscription_plans

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `name` | text | YES |  |
| `recurring_interval` | text | YES |  |
| `recurring_count` | integer | YES | 1 |
| `organization_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`

### subscriptions

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `contact_id` | bigint | YES |  |
| `plan_id` | bigint | YES |  |
| `price_book_id` | bigint | YES |  |
| `currency_code` | char(3) | YES |  |
| `date_start` | date | YES |  |
| `next_invoice_date` | date | YES |  |
| `date_end` | date | YES |  |
| `state` | text | YES |  |
| `mrr` | numeric(18,4) | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `contact_id` -> `contacts`.`id`
- `currency_code` -> `currencies`.`code`
- `organization_id` -> `organizations`.`id`
- `plan_id` -> `subscription_plans`.`id`

### supplier_products

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `item_id` | bigint | NO |  |
| `supplier_id` | bigint | NO |  |
| `supplier_sku` | text | YES |  |
| `supplier_product_name` | text | YES |  |
| `min_qty` | numeric(18,4) | YES | 1 |
| `price` | numeric(18,4) | YES |  |
| `currency_code` | char(3) | YES |  |
| `lead_time_days` | integer | YES |  |
| `priority` | integer | YES | 10 |
| `valid_from` | date | YES |  |
| `valid_to` | date | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `currency_code` -> `currencies`.`code`
- `item_id` -> `item_variants`.`id`
- `supplier_id` -> `contacts`.`id`

### supplier_quote_lines

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `supplier_quote_id` | bigint | YES |  |
| `quote_request_line_id` | bigint | YES |  |
| `item_id` | bigint | YES |  |
| `description` | text | YES |  |
| `qty` | numeric(18,4) | YES |  |
| `unit_price` | numeric(18,4) | YES |  |
| `discount_pct` | numeric(8,4) | YES | 0 |
| `price_subtotal` | numeric(18,4) | YES | 0 |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `item_id` -> `item_variants`.`id`
- `quote_request_line_id` -> `supplier_quote_request_lines`.`id`
- `supplier_quote_id` -> `supplier_quotes`.`id`

### supplier_quote_request_lines

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `quote_request_id` | bigint | YES |  |
| `item_id` | bigint | YES |  |
| `description` | text | YES |  |
| `qty` | numeric(18,4) | YES |  |
| `unit_id` | bigint | YES |  |
| `needed_by` | date | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `item_id` -> `item_variants`.`id`
- `quote_request_id` -> `supplier_quote_requests`.`id`
- `unit_id` -> `units`.`id`

### supplier_quote_requests

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `requester_id` | bigint | YES |  |
| `supplier_id` | bigint | YES |  |
| `currency_code` | char(3) | YES |  |
| `state` | text | YES |  |
| `order_date` | date | YES |  |
| `quote_deadline` | date | YES |  |
| `notes` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `currency_code` -> `currencies`.`code`
- `organization_id` -> `organizations`.`id`
- `requester_id` -> `contacts`.`id`
- `supplier_id` -> `contacts`.`id`

### supplier_quotes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `quote_request_id` | bigint | YES |  |
| `supplier_id` | bigint | NO |  |
| `currency_code` | char(3) | YES |  |
| `state` | text | YES |  |
| `quote_date` | date | YES |  |
| `valid_until` | date | YES |  |
| `notes` | text | YES |  |
| `amount_untaxed` | numeric(18,4) | YES | 0 |
| `amount_tax` | numeric(18,4) | YES | 0 |
| `amount_total` | numeric(18,4) | YES | 0 |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `currency_code` -> `currencies`.`code`
- `quote_request_id` -> `supplier_quote_requests`.`id`
- `supplier_id` -> `contacts`.`id`

### supplier_scorecards

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `supplier_id` | bigint | NO |  |
| `period_start` | date | YES |  |
| `period_end` | date | YES |  |
| `quality_score` | numeric(5,2) | YES | 0 |
| `delivery_score` | numeric(5,2) | YES | 0 |
| `price_score` | numeric(5,2) | YES | 0 |
| `overall_score` | numeric(5,2) | YES | 0 |
| `total_orders` | integer | YES | 0 |
| `on_time_deliveries` | integer | YES | 0 |
| `quality_failures` | integer | YES | 0 |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`
- `supplier_id` -> `contacts`.`id`

### supply_agreement_lines

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `agreement_id` | bigint | NO |  |
| `item_id` | bigint | YES |  |
| `description` | text | YES |  |
| `qty` | numeric(18,4) | YES |  |
| `unit_price` | numeric(18,4) | YES |  |
| `unit_id` | bigint | YES |  |
| `needed_by` | date | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `agreement_id` -> `supply_agreements`.`id`
- `item_id` -> `item_variants`.`id`
- `unit_id` -> `units`.`id`

### supply_agreements

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `supplier_id` | bigint | NO |  |
| `currency_code` | char(3) | YES |  |
| `state` | text | YES |  |
| `start_date` | date | YES |  |
| `end_date` | date | YES |  |
| `amount_limit` | numeric(18,4) | YES | 0 |
| `qty_limit` | numeric(18,4) | YES | 0 |
| `consumed_amount` | numeric(18,4) | YES | 0 |
| `consumed_qty` | numeric(18,4) | YES | 0 |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `currency_code` -> `currencies`.`code`
- `organization_id` -> `organizations`.`id`
- `supplier_id` -> `contacts`.`id`

### system_configs

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `key` | text | YES |  |
| `value` | jsonb | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`

### tax_periods

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `tax_year_id` | bigint | YES |  |
| `name` | text | YES |  |
| `date_start` | date | YES |  |
| `date_end` | date | YES |  |
| `state` | text | YES |  |
| `period_type` | text | YES | 'standard'::text |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`
- `tax_year_id` -> `tax_years`.`id`

### tax_returns

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `period_id` | bigint | YES |  |
| `type` | text | YES |  |
| `output_tax` | numeric(18,4) | YES |  |
| `input_tax` | numeric(18,4) | YES |  |
| `net_payable` | numeric(18,4) | YES |  |
| `state` | text | YES |  |
| `filed_at` | timestamp | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`
- `period_id` -> `tax_periods`.`id`

### tax_rule_account_maps

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `tax_rule_id` | bigint | YES |  |
| `src_account_id` | bigint | YES |  |
| `dest_account_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `dest_account_id` -> `accounts`.`id`
- `src_account_id` -> `accounts`.`id`
- `tax_rule_id` -> `tax_rules`.`id`

### tax_rule_tax_maps

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `tax_rule_id` | bigint | YES |  |
| `src_tax_id` | bigint | YES |  |
| `dest_tax_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `dest_tax_id` -> `taxes`.`id`
- `src_tax_id` -> `taxes`.`id`
- `tax_rule_id` -> `tax_rules`.`id`

### tax_rules

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `country_code` | char(2) | YES |  |
| `auto_apply` | boolean | YES | false |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`

### tax_years

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `date_start` | date | YES |  |
| `date_end` | date | YES |  |
| `state` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`

### taxes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | NO |  |
| `amount` | numeric(8,4) | YES |  |
| `type` | text | YES |  |
| `scope` | text | YES |  |
| `price_include` | boolean | YES | false |
| `tax_account_id` | bigint | YES |  |
| `refund_tax_account_id` | bigint | YES |  |
| `active` | boolean | YES | true |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`
- `refund_tax_account_id` -> `accounts`.`id`
- `tax_account_id` -> `accounts`.`id`

### timesheets

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `employee_id` | bigint | YES |  |
| `date` | date | YES |  |
| `project_id` | bigint | YES |  |
| `task_id` | bigint | YES |  |
| `dimension_id` | bigint | YES |  |
| `hours` | numeric(8,2) | YES |  |
| `description` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `dimension_id` -> `dimensions`.`id`
- `employee_id` -> `employees`.`id`
- `project_id` -> `projects`.`id`
- `task_id` -> `project_tasks`.`id`

### unit_groups

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `name` | text | NO |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |
| `organization_id` | bigint | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`

### units

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `category_id` | bigint | NO |  |
| `name` | text | NO |  |
| `factor` | numeric(28,8) | NO |  |
| `unit_type` | text | YES |  |
| `rounding` | numeric(12,6) | YES | 0.01 |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |
| `organization_id` | bigint | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `category_id` -> `unit_groups`.`id`
- `organization_id` -> `organizations`.`id`

### user_email_verifications

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `user_id` | bigint | NO |  |
| `verification_token` | text | YES |  |
| `expires_at` | timestamp | YES |  |
| `used_at` | timestamp | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `user_id` -> `users`.`id`

### user_oauth_identities

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `user_id` | bigint | NO |  |
| `provider` | text | NO |  |
| `provider_user_id` | text | NO |  |
| `email` | text | YES |  |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |
| `deleted_at` | timestamptz | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `user_id` -> `users`.`id`

### user_password_resets

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `user_id` | bigint | NO |  |
| `reset_token_hash` | text | NO |  |
| `expires_at` | timestamp | NO |  |
| `used_at` | timestamp | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `user_id` -> `users`.`id`

### user_sessions

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `device_name` | text | YES |  |
| `os` | text | YES |  |
| `browser` | text | YES |  |
| `user_agent` | text | YES |  |
| `refresh_token` | text | NO |  |
| `ip_address` | text | YES |  |
| `country` | text | YES |  |
| `city` | text | YES |  |
| `expires_at` | timestamp | YES |  |
| `revoked_at` | timestamp | YES |  |
| `last_used_at` | timestamp | YES |  |
| `user_id` | bigint | NO |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `user_id` -> `users`.`id`

### users

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `username` | text | NO |  |
| `first_name` | text | YES |  |
| `last_name` | text | YES |  |
| `email` | text | NO |  |
| `phone` | text | YES |  |
| `password` | text | NO |  |
| `avatar` | text | YES |  |
| `bio` | text | YES |  |
| `birthday` | date | YES |  |
| `active` | boolean | YES | false |
| `private` | boolean | YES | false |
| `sex` | text | YES |  |
| `address` | text | YES |  |
| `city` | text | YES |  |
| `postal_code` | text | YES |  |
| `email_verified_at` | timestamp | YES |  |
| `phone_verified_at` | timestamp | YES |  |
| `contact_id` | bigint | YES |  |
| `last_login` | timestamp | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `contact_id` -> `contacts`.`id`

### warehouse_transfers

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `src_warehouse_id` | bigint | YES |  |
| `dst_warehouse_id` | bigint | YES |  |
| `state` | text | YES |  |
| `out_shipment_id` | bigint | YES |  |
| `in_shipment_id` | bigint | YES |  |
| `is_interorganization` | boolean | YES | false |
| `scheduled_date` | date | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `dst_warehouse_id` -> `warehouses`.`id`
- `in_shipment_id` -> `shipments`.`id`
- `organization_id` -> `organizations`.`id`
- `out_shipment_id` -> `shipments`.`id`
- `src_warehouse_id` -> `warehouses`.`id`

### warehouses

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | NO |  |
| `code` | text | YES |  |
| `line1` | text | YES |  |
| `line2` | text | YES |  |
| `city` | text | YES |  |
| `state` | text | YES |  |
| `postal_code` | text | YES |  |
| `country_code` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `organization_id` -> `organizations`.`id`

### webhook_deliveries

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `event_id` | bigint | NO |  |
| `subscription_id` | bigint | YES |  |
| `organization_id` | bigint | YES |  |
| `status` | text | YES |  |
| `attempt` | integer | YES | 0 |
| `response_code` | integer | YES |  |
| `error` | text | YES |  |
| `delivered_at` | timestamptz | YES |  |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |
| `deleted_at` | timestamptz | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `event_id` -> `integration_events`.`id`
- `subscription_id` -> `webhook_subscriptions`.`id`

### webhook_subscriptions

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `url` | text | NO |  |
| `secret` | text | NO |  |
| `enabled` | boolean | YES | true |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |
| `deleted_at` | timestamptz | YES |  |

**Primary key:** `id`

### withholding_taxes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | YES |  |
| `rate_pct` | numeric(8,4) | YES |  |
| `account_id` | bigint | YES |  |
| `scope` | text | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `account_id` -> `accounts`.`id`
- `organization_id` -> `organizations`.`id`

### work_centers

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO |  |
| `organization_id` | bigint | YES |  |
| `name` | text | NO |  |
| `code` | text | YES |  |
| `cost_per_hour` | numeric(18,4) | YES |  |
| `capacity_per_hour` | numeric(18,4) | YES |  |
| `efficiency_pct` | numeric(6,2) | YES | 100 |
| `oee_target` | numeric(6,2) | YES |  |
| `dimension_id` | bigint | YES |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp | YES |  |

**Primary key:** `id`

**Foreign keys:**

- `dimension_id` -> `dimensions`.`id`
- `organization_id` -> `organizations`.`id`

