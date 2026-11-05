export const SUPPORT_CHANNELS = [
  {
    id: "docs",
    code: "DOCS // /guides",
    titleKey: "channel1Title",
    descriptionKey: "channel1Description",
    actionKey: "channel1Action",
    href: "/guides",
    kind: "internal",
  },
  {
    id: "email",
    code: "MAIL // support@",
    titleKey: "channel2Title",
    descriptionKey: "channel2Description",
    actionKey: "channel2Action",
    href: "mailto:support@swantara.com",
    kind: "email",
  },
  {
    id: "status",
    code: "STAT // LIVE",
    titleKey: "channel3Title",
    descriptionKey: "channel3Description",
    actionKey: "channel3Action",
    href: "",
    kind: "status",
  },
  {
    id: "sales",
    code: "HUMAN // /contact",
    titleKey: "channel4Title",
    descriptionKey: "channel4Description",
    actionKey: "channel4Action",
    href: "/contact",
    kind: "internal",
  },
] as const;

export const SUPPORT_RESPONSE_ROWS = [
  {
    id: "starter",
    plan: "Starter",
    channelKey: "row1Channel",
    timeKey: "row1Time",
    popular: false,
  },
  {
    id: "growth",
    plan: "Growth",
    channelKey: "row2Channel",
    timeKey: "row2Time",
    popular: true,
  },
  {
    id: "scale",
    plan: "Scale",
    channelKey: "row3Channel",
    timeKey: "row3Time",
    popular: false,
  },
] as const;

export const SUPPORT_FAQ_ITEMS = [
  { id: "sfaq-1", index: "01", questionKey: "faq1Question", answerKey: "faq1Answer" },
  { id: "sfaq-2", index: "02", questionKey: "faq2Question", answerKey: "faq2Answer" },
  { id: "sfaq-3", index: "03", questionKey: "faq3Question", answerKey: "faq3Answer" },
  { id: "sfaq-4", index: "04", questionKey: "faq4Question", answerKey: "faq4Answer" },
] as const;
