import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SupportSection } from "./_components/support-section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Marketing.meta");
  const title = t("supportTitle");
  const description = t("supportDescription");

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
        en: "/support",
        id: "/support",
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function SupportPage() {
  return <SupportSection />;
}
