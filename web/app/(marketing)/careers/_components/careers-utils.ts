export const CAREERS_VALUES = [
  { id: "ownership", index: "01", titleKey: "why1Title", descriptionKey: "why1Description" },
  { id: "craft", index: "02", titleKey: "why2Title", descriptionKey: "why2Description" },
  { id: "pace", index: "03", titleKey: "why3Title", descriptionKey: "why3Description" },
  { id: "feedback", index: "04", titleKey: "why4Title", descriptionKey: "why4Description" },
] as const;

export const CAREERS_ROLES = [
  {
    id: "product-engineer",
    team: "Engineering",
    title: "Product Engineer",
    location: "Remote · Jakarta",
    type: "Full-time",
  },
  {
    id: "product-designer",
    team: "Design",
    title: "Product Designer",
    location: "Remote · Bandung",
    type: "Full-time",
  },
  {
    id: "technical-pm",
    team: "Product",
    title: "Technical Product Manager",
    location: "Jakarta · Hybrid",
    type: "Full-time",
  },
  {
    id: "implementation-lead",
    team: "Customer Success",
    title: "Implementation Lead",
    location: "Remote · Jakarta",
    type: "Full-time",
  },
  {
    id: "data-engineer",
    team: "Data",
    title: "Data Engineer",
    location: "Remote · Yogyakarta",
    type: "Contract",
  },
  {
    id: "payroll-specialist",
    team: "Finance",
    title: "Payroll Specialist",
    location: "Jakarta · On-site",
    type: "Full-time",
  },
] as const;

export const CAREERS_PROCESS = [
  {
    id: "intro",
    index: "01",
    code: "STEP // 30 MIN",
    titleKey: "process1Title",
    descriptionKey: "process1Description",
  },
  {
    id: "craft",
    index: "02",
    code: "STEP // PAID TASK",
    titleKey: "process2Title",
    descriptionKey: "process2Description",
  },
  {
    id: "team",
    index: "03",
    code: "STEP // ANSWER 1 WEEK",
    titleKey: "process3Title",
    descriptionKey: "process3Description",
  },
] as const;

export const CAREERS_BENEFITS = [
  { id: "health", index: "01", key: "benefit1Title" },
  { id: "office", index: "02", key: "benefit2Title" },
  { id: "learning", index: "03", key: "benefit3Title" },
  { id: "leave", index: "04", key: "benefit4Title" },
  { id: "equity", index: "05", key: "benefit5Title" },
  { id: "meetups", index: "06", key: "benefit6Title" },
] as const;
