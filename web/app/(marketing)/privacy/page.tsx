import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PrivacySection } from "./_components/privacy-section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Marketing.meta");
  const title = t("privacyTitle");
  const description = t("privacyDescription");

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
        en: "/privacy",
        id: "/privacy",
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function PrivacyPage() {
  return <PrivacySection />;
}
