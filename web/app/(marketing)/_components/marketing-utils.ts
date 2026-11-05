export type MarketingNavKey = "product" | "pricing" | "about" | "contact";

export type MarketingNavItem = {
  key: MarketingNavKey;
  href: string;
};

export const MARKETING_NAV_ITEMS: readonly MarketingNavItem[] = [
  { key: "product", href: "/product" },
  { key: "pricing", href: "/pricing" },
  { key: "about", href: "/about" },
  { key: "contact", href: "/contact" },
] as const;

export const PARTNER_LOGO_KEYS = [
  "logoNorthwind",
  "logoKala",
  "logoMeridian",
  "logoForma",
  "logoAtlas",
  "logoAster",
] as const;

export const PLATFORM_STAT_ITEMS = [
  { id: "teams", valueKey: "statTeamsValue", labelKey: "statTeamsLabel", index: "01" },
  { id: "uptime", valueKey: "statUptimeValue", labelKey: "statUptimeLabel", index: "02" },
  { id: "countries", valueKey: "statCountriesValue", labelKey: "statCountriesLabel", index: "03" },
  { id: "rating", valueKey: "statRatingValue", labelKey: "statRatingLabel", index: "04" },
] as const;

export type RevenueBarDatum = {
  id: string;
  period: string;
  actualHeightClass: string;
  planHeightClass: string;
  delta: string;
};

export const HERO_REVENUE_SERIES: readonly RevenueBarDatum[] = [
  {
    id: "m01",
    period: "01",
    actualHeightClass: "h-16",
    planHeightClass: "h-14",
    delta: "+6.2%",
  },
  {
    id: "m02",
    period: "02",
    actualHeightClass: "h-20",
    planHeightClass: "h-16",
    delta: "+8.4%",
  },
  {
    id: "m03",
    period: "03",
    actualHeightClass: "h-24",
    planHeightClass: "h-20",
    delta: "+9.1%",
  },
  {
    id: "m04",
    period: "04",
    actualHeightClass: "h-22",
    planHeightClass: "h-20",
    delta: "+5.8%",
  },
  {
    id: "m05",
    period: "05",
    actualHeightClass: "h-28",
    planHeightClass: "h-24",
    delta: "+11.0%",
  },
  {
    id: "m06",
    period: "06",
    actualHeightClass: "h-32",
    planHeightClass: "h-26",
    delta: "+12.4%",
  },
] as const;

export type HomeFeatureConfig = {
  id: string;
  index: string;
  flowCode: string;
  titleKey:
    | "feature1Title"
    | "feature2Title"
    | "feature3Title"
    | "feature4Title"
    | "feature5Title"
    | "feature6Title";
  descriptionKey:
    | "feature1Description"
    | "feature2Description"
    | "feature3Description"
    | "feature4Description"
    | "feature5Description"
    | "feature6Description";
  metricCode: string;
};

export const HOME_FEATURE_CONFIGS: readonly HomeFeatureConfig[] = [
  {
    id: "command",
    index: "01",
    flowCode: "SYS // LIVE",
    titleKey: "feature1Title",
    descriptionKey: "feature1Description",
    metricCode: "99.99% SYNC",
  },
  {
    id: "sales",
    index: "02",
    flowCode: "O2C // FLOW",
    titleKey: "feature2Title",
    descriptionKey: "feature2Description",
    metricCode: "QUOTE -> CASH",
  },
  {
    id: "inventory",
    index: "03",
    flowCode: "I2F // STOCK",
    titleKey: "feature3Title",
    descriptionKey: "feature3Description",
    metricCode: "MULTI-LOC",
  },
  {
    id: "finance",
    index: "04",
    flowCode: "R2R // LEDGER",
    titleKey: "feature4Title",
    descriptionKey: "feature4Description",
    metricCode: "AUTO-RECON",
  },
  {
    id: "people",
    index: "05",
    flowCode: "H2R // TEAM",
    titleKey: "feature5Title",
    descriptionKey: "feature5Description",
    metricCode: "PAYROLL RUN",
  },
  {
    id: "service",
    index: "06",
    flowCode: "S2C // FIELD",
    titleKey: "feature6Title",
    descriptionKey: "feature6Description",
    metricCode: "SLA 100%",
  },
] as const;

export const HOME_FAQ_ITEMS = [
  { id: "faq-1", index: "01", questionKey: "faq1Question", answerKey: "faq1Answer" },
  { id: "faq-2", index: "02", questionKey: "faq2Question", answerKey: "faq2Answer" },
  { id: "faq-3", index: "03", questionKey: "faq3Question", answerKey: "faq3Answer" },
  { id: "faq-4", index: "04", questionKey: "faq4Question", answerKey: "faq4Answer" },
] as const;

export function splitTitle(text: string): string[] {
  return text.split("\n").map((line) => line.trim());
}
