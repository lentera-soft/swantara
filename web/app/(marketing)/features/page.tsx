import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FeaturesSection } from "./_components/features-section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Marketing.meta");
  const title = t("featuresTitle");
  const description = t("featuresDescription");

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
        en: "/features",
        id: "/features",
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function FeaturesPage() {
  return <FeaturesSection />;
}
