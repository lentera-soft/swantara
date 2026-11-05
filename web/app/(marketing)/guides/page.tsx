import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { GuidesSection } from "./_components/guides-section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Marketing.meta");
  const title = t("guidesTitle");
  const description = t("guidesDescription");

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
        en: "/guides",
        id: "/guides",
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function GuidesPage() {
  return <GuidesSection />;
}
