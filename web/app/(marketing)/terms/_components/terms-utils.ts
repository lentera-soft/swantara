import type { LegalSectionConfig } from "../../_components/legal-document";

export const TERMS_SECTIONS: readonly LegalSectionConfig[] = [
  {
    id: "acceptance",
    index: "01",
    titleKey: "section1Title",
    paragraphKeys: ["section1P1", "section1P2"],
  },
  {
    id: "accounts",
    index: "02",
    titleKey: "section2Title",
    paragraphKeys: ["section2P1", "section2P2"],
  },
  {
    id: "billing",
    index: "03",
    titleKey: "section3Title",
    paragraphKeys: ["section3P1", "section3P2"],
  },
  {
    id: "trial",
    index: "04",
    titleKey: "section4Title",
    paragraphKeys: ["section4P1", "section4P2"],
  },
  {
    id: "acceptable-use",
    index: "05",
    titleKey: "section5Title",
    paragraphKeys: ["section5P1", "section5P2"],
  },
  {
    id: "intellectual-property",
    index: "06",
    titleKey: "section6Title",
    paragraphKeys: ["section6P1", "section6P2"],
  },
  {
    id: "availability",
    index: "07",
    titleKey: "section7Title",
    paragraphKeys: ["section7P1", "section7P2"],
  },
  {
    id: "liability",
    index: "08",
    titleKey: "section8Title",
    paragraphKeys: ["section8P1", "section8P2"],
  },
  {
    id: "termination",
    index: "09",
    titleKey: "section9Title",
    paragraphKeys: ["section9P1", "section9P2"],
  },
] as const;
