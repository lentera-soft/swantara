export const CHANGELOG_RELEASES = [
  {
    id: "v2-6",
    versionKey: "release1Version",
    dateKey: "release1Date",
    tagKey: "release1Tag",
    titleKey: "release1Title",
    descriptionKey: "release1Description",
  },
  {
    id: "v2-5",
    versionKey: "release2Version",
    dateKey: "release2Date",
    tagKey: "release2Tag",
    titleKey: "release2Title",
    descriptionKey: "release2Description",
  },
  {
    id: "v2-4",
    versionKey: "release3Version",
    dateKey: "release3Date",
    tagKey: "release3Tag",
    titleKey: "release3Title",
    descriptionKey: "release3Description",
  },
  {
    id: "v2-3",
    versionKey: "release4Version",
    dateKey: "release4Date",
    tagKey: "release4Tag",
    titleKey: "release4Title",
    descriptionKey: "release4Description",
  },
  {
    id: "v2-2",
    versionKey: "release5Version",
    dateKey: "release5Date",
    tagKey: "release5Tag",
    titleKey: "release5Title",
    descriptionKey: "release5Description",
  },
] as const;

export const CHANGELOG_CADENCE = [
  { id: "weekly", index: "01", key: "cadence1" },
  { id: "flags", index: "02", key: "cadence2" },
  { id: "notice", index: "03", key: "cadence3" },
] as const;
