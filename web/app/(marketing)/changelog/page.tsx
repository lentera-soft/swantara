import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ChangelogSection } from "./_components/changelog-section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Marketing.meta");
  const title = t("changelogTitle");
  const description = t("changelogDescription");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    alternates: {
      languages: {
        en: "/changelog",
        id: "/changelog",
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function ChangelogPage() {
  return <ChangelogSection />;
}
