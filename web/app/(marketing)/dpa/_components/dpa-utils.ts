import type { LegalSectionConfig } from "../../_components/legal-document";

export const DPA_SECTIONS: readonly LegalSectionConfig[] = [
  {
    id: "roles",
    index: "01",
    titleKey: "section1Title",
    paragraphKeys: ["section1P1", "section1P2"],
  },
  {
    id: "subject-matter",
    index: "02",
    titleKey: "section2Title",
    paragraphKeys: ["section2P1", "section2P2"],
  },
  {
    id: "duration",
    index: "03",
    titleKey: "section3Title",
    paragraphKeys: ["section3P1", "section3P2"],
  },
  {
    id: "security",
    index: "04",
    titleKey: "section4Title",
    paragraphKeys: ["section4P1", "section4P2"],
  },
  {
    id: "subprocessing",
    index: "05",
    titleKey: "section5Title",
    paragraphKeys: ["section5P1", "section5P2"],
  },
  {
    id: "data-subject-requests",
    index: "06",
    titleKey: "section6Title",
    paragraphKeys: ["section6P1", "section6P2"],
  },
  {
    id: "transfers",
    index: "07",
    titleKey: "section7Title",
    paragraphKeys: ["section7P1", "section7P2"],
  },
] as const;
