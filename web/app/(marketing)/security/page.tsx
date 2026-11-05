import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SecuritySection } from "./_components/security-section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Marketing.meta");
  const title = t("securityTitle");
  const description = t("securityDescription");

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
        en: "/security",
        id: "/security",
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function SecurityPage() {
  return <SecuritySection />;
}
