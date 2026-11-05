type QuestionnaireItemDefinition = { name: string; required?: boolean };

export const ONBOARDING_ITEMS: readonly QuestionnaireItemDefinition[] = [
  { name: "companyInfo", required: true },
  { name: "companyAddress", required: false },
];

export function resolveStandardCode(countryCode: string): string {
  if (countryCode.toUpperCase() !== "ID") {
    return "IFRS";
  }
  return "PSAK_EMKM";
}
