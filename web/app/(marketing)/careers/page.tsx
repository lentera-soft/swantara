import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CareersSection } from "./_components/careers-section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Marketing.meta");
  const title = t("careersTitle");
  const description = t("careersDescription");

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
        en: "/careers",
        id: "/careers",
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function CareersPage() {
  return <CareersSection />;
}
