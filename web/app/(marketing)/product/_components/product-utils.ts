export type ProductModuleConfig = {
  id: string;
  index: string;
  flowCode: string;
  eyebrowKey:
    | "module1Eyebrow"
    | "module2Eyebrow"
    | "module3Eyebrow"
    | "module4Eyebrow"
    | "module5Eyebrow";
  titleKey: "module1Title" | "module2Title" | "module3Title" | "module4Title" | "module5Title";
  descriptionKey:
    | "module1Description"
    | "module2Description"
    | "module3Description"
    | "module4Description"
    | "module5Description";
  pointKeys: readonly [
    "module1Point1" | "module2Point1" | "module3Point1" | "module4Point1" | "module5Point1",
    "module1Point2" | "module2Point2" | "module3Point2" | "module4Point2" | "module5Point2",
    "module1Point3" | "module2Point3" | "module3Point3" | "module4Point3" | "module5Point3",
  ];
  records: readonly {
    id: string;
    ref: string;
    entity: string;
    metric: string;
    state: string;
  }[];
};

export const PRODUCT_MODULES: readonly ProductModuleConfig[] = [
  {
    id: "sales-crm",
    index: "01",
    flowCode: "O2C // QUOTE -> ORDER -> INVOICE",
    eyebrowKey: "module1Eyebrow",
    titleKey: "module1Title",
    descriptionKey: "module1Description",
    pointKeys: ["module1Point1", "module1Point2", "module1Point3"],
    records: [
      {
        id: "r1",
        ref: "SO-2026-041",
        entity: "Northwind Retail",
        metric: "98.4%",
        state: "CONFIRMED",
      },
      { id: "r2", ref: "QT-2026-118", entity: "Kala Studio", metric: "14d SLA", state: "SENT" },
      {
        id: "r3",
        ref: "INV-2026-092",
        entity: "Meridian Group",
        metric: "NET-30",
        state: "POSTED",
      },
    ],
  },
  {
    id: "inventory-fulfillment",
    index: "02",
    flowCode: "I2F // INBOUND -> TRANSFER -> COUNT",
    eyebrowKey: "module2Eyebrow",
    titleKey: "module2Title",
    descriptionKey: "module2Description",
    pointKeys: ["module2Point1", "module2Point2", "module2Point3"],
    records: [
      {
        id: "r1",
        ref: "WH-JKT-01",
        entity: "Central Fulfillment",
        metric: "1,420 SKU",
        state: "SYNCED",
      },
      {
        id: "r2",
        ref: "TRF-2026-019",
        entity: "JKT -> BDG Hub",
        metric: "240 UNITS",
        state: "IN TRANSIT",
      },
      {
        id: "r3",
        ref: "ROP-AUTO-07",
        entity: "Safety Stock Rule",
        metric: "MIN 50",
        state: "ACTIVE",
      },
    ],
  },
  {
    id: "finance-accounting",
    index: "03",
    flowCode: "R2R // JOURNAL -> RECONCILE -> CLOSE",
    eyebrowKey: "module3Eyebrow",
    titleKey: "module3Title",
    descriptionKey: "module3Description",
    pointKeys: ["module3Point1", "module3Point2", "module3Point3"],
    records: [
      {
        id: "r1",
        ref: "JE-2026-884",
        entity: "Operating Ledger",
        metric: "0.00 DIFF",
        state: "BALANCED",
      },
      {
        id: "r2",
        ref: "BNK-RECON-10",
        entity: "Treasury Clearing",
        metric: "100% MATCH",
        state: "VERIFIED",
      },
      {
        id: "r3",
        ref: "PER-2026-Q3",
        entity: "Multi-Entity Close",
        metric: "3 ENTITIES",
        state: "LOCKED",
      },
    ],
  },
  {
    id: "people-payroll",
    index: "04",
    flowCode: "H2R // ATTENDANCE -> TIMESHEET -> PAY",
    eyebrowKey: "module4Eyebrow",
    titleKey: "module4Title",
    descriptionKey: "module4Description",
    pointKeys: ["module4Point1", "module4Point2", "module4Point3"],
    records: [
      {
        id: "r1",
        ref: "PAY-2026-10",
        entity: "Monthly Payroll Run",
        metric: "84 STAFF",
        state: "APPROVED",
      },
      {
        id: "r2",
        ref: "ATT-SYNC-26",
        entity: "Shift & Leave Ledger",
        metric: "99.2% ON-TIME",
        state: "LIVE",
      },
      {
        id: "r3",
        ref: "SLP-BATCH-10",
        entity: "Payslip Dispatch",
        metric: "84 / 84",
        state: "ISSUED",
      },
    ],
  },
  {
    id: "projects-service",
    index: "05",
    flowCode: "S2C // PROJECT -> CONTRACT -> SLA",
    eyebrowKey: "module5Eyebrow",
    titleKey: "module5Title",
    descriptionKey: "module5Description",
    pointKeys: ["module5Point1", "module5Point2", "module5Point3"],
    records: [
      {
        id: "r1",
        ref: "PRJ-2026-14",
        entity: "Rollout Implementation",
        metric: "78% WIP",
        state: "ON TRACK",
      },
      {
        id: "r2",
        ref: "SVC-2026-52",
        entity: "Preventive Maintenance",
        metric: "Q4 PLAN",
        state: "SCHEDULED",
      },
      {
        id: "r3",
        ref: "QC-2026-301",
        entity: "Inspection Protocol",
        metric: "PASS 100%",
        state: "VERIFIED",
      },
    ],
  },
] as const;

export const SECURITY_SPECS = [
  { id: "s1", index: "01", code: "TLS 1.3 // AES-256", key: "securityPoint1" },
  { id: "s2", index: "02", code: "IAM // RBAC + JWT", key: "securityPoint2" },
  { id: "s3", index: "03", code: "AUDIT // IMMUTABLE", key: "securityPoint3" },
  { id: "s4", index: "04", code: "RPO // DAILY SNAPSHOT", key: "securityPoint4" },
] as const;

export const INTEGRATION_PROTOCOLS = [
  { id: "i1", index: "01", name: "REST API v1", spec: "OpenAPI 3.0 / JSON" },
  { id: "i2", index: "02", name: "Webhooks", spec: "HMAC-SHA256 Signed" },
  { id: "i3", index: "03", name: "Bank Feeds", spec: "MT940 / CSV / ISO" },
  { id: "i4", index: "04", name: "Document Vault", spec: "S3-Compatible Object" },
  { id: "i5", index: "05", name: "POS Hardware", spec: "ESC/POS & Barcode" },
  { id: "i6", index: "06", name: "SMTP / Mail", spec: "Transactional Dispatch" },
] as const;
