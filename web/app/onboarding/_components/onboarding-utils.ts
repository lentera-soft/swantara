type QuestionnaireItemDefinition = { name: string; required?: boolean };

export const ONBOARDING_ITEMS: readonly QuestionnaireItemDefinition[] = [
  { name: "companyInfo", required: true },
];

export function resolveStandardCode(countryCode: string): string {
  if (countryCode.toUpperCase() !== "ID") {
    return "IFRS";
  }
  return "PSAK_EMKM";
}
