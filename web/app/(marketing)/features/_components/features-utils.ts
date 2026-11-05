export const FEATURE_MATRIX = [
  { id: "pipeline", index: "01", titleKey: "feature1Title", descriptionKey: "feature1Description" },
  { id: "stock", index: "02", titleKey: "feature2Title", descriptionKey: "feature2Description" },
  {
    id: "reorder",
    index: "03",
    titleKey: "feature3Title",
    descriptionKey: "feature3Description",
  },
  { id: "ledger", index: "04", titleKey: "feature4Title", descriptionKey: "feature4Description" },
  {
    id: "reconcile",
    index: "05",
    titleKey: "feature5Title",
    descriptionKey: "feature5Description",
  },
  { id: "payroll", index: "06", titleKey: "feature6Title", descriptionKey: "feature6Description" },
  { id: "leave", index: "07", titleKey: "feature7Title", descriptionKey: "feature7Description" },
  { id: "service", index: "08", titleKey: "feature8Title", descriptionKey: "feature8Description" },
  {
    id: "dashboards",
    index: "09",
    titleKey: "feature9Title",
    descriptionKey: "feature9Description",
  },
] as const;

export const INCLUDED_ITEMS = [
  { id: "audit", index: "01", name: "Audit trail", spec: "Immutable, record by record" },
  { id: "api", index: "02", name: "REST API v1", spec: "OpenAPI 3.0 / JSON" },
  { id: "webhooks", index: "03", name: "Webhooks", spec: "HMAC-SHA256 signed" },
  { id: "rbac", index: "04", name: "Role-based access", spec: "Least-privilege defaults" },
  { id: "backups", index: "05", name: "Daily backups", spec: "Encrypted snapshots" },
  { id: "export", index: "06", name: "Data export", spec: "CSV and JSON, anytime" },
  { id: "two-factor", index: "07", name: "Two-factor auth", spec: "TOTP ready" },
  { id: "dark", index: "08", name: "Dark mode", spec: "Everywhere, automatic" },
] as const;
