import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TermsSection } from "./_components/terms-section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Marketing.meta");
  const title = t("termsTitle");
  const description = t("termsDescription");

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
        en: "/terms",
        id: "/terms",
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function TermsPage() {
  return <TermsSection />;
}
