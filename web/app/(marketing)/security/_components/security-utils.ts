export const SECURITY_PILLARS = [
  {
    id: "encryption",
    code: "AES-256 // TLS 1.3",
    titleKey: "pillar1Title",
    descriptionKey: "pillar1Description",
  },
  {
    id: "access",
    code: "RBAC // SSO",
    titleKey: "pillar2Title",
    descriptionKey: "pillar2Description",
  },
  {
    id: "audit",
    code: "AUDIT // IMMUTABLE",
    titleKey: "pillar3Title",
    descriptionKey: "pillar3Description",
  },
  {
    id: "backups",
    code: "RPO 24H // RESTORE",
    titleKey: "pillar4Title",
    descriptionKey: "pillar4Description",
  },
  {
    id: "processes",
    code: "ISO 27001 // ALIGNED",
    titleKey: "pillar5Title",
    descriptionKey: "pillar5Description",
  },
  {
    id: "privacy",
    code: "GDPR // DPDP",
    titleKey: "pillar6Title",
    descriptionKey: "pillar6Description",
  },
] as const;

export const SECURITY_COMMITMENTS = [
  { id: "c1", index: "01", key: "commit1" },
  { id: "c2", index: "02", key: "commit2" },
  { id: "c3", index: "03", key: "commit3" },
  { id: "c4", index: "04", key: "commit4" },
  { id: "c5", index: "05", key: "commit5" },
  { id: "c6", index: "06", key: "commit6" },
] as const;

export const SECURITY_CONTACT_EMAIL = "security@swantara.com";
