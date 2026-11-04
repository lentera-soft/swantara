export type OrgModuleId =
  | "crm"
  | "production"
  | "inventory"
  | "procurement"
  | "hr"
  | "projectManagement"
  | "finance"
  | "salesService"
  | "reference";

export const ALL_MODULE_IDS: OrgModuleId[] = [
  "crm",
  "production",
  "inventory",
  "procurement",
  "hr",
  "projectManagement",
  "finance",
  "salesService",
  "reference",
];

const storageKey = (orgId: string) => `swantara.enabledModules.${orgId}`;

function readEnabled(orgId: string): OrgModuleId[] {
  if (typeof window === "undefined") {
    return ALL_MODULE_IDS;
  }
  try {
    const raw = window.localStorage.getItem(storageKey(orgId));
    if (!raw) {
      return ALL_MODULE_IDS;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return ALL_MODULE_IDS;
    }
    const valid = parsed.filter((value): value is OrgModuleId =>
      ALL_MODULE_IDS.includes(value as OrgModuleId),
    );
    return valid.length > 0 ? valid : ALL_MODULE_IDS;
  } catch {
    return ALL_MODULE_IDS;
  }
}

export function loadEnabledModules(orgId: string): OrgModuleId[] {
  return readEnabled(orgId);
}

export function saveEnabledModules(orgId: string, enabled: OrgModuleId[]): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(storageKey(orgId), JSON.stringify(enabled));
}
