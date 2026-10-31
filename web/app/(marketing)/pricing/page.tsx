import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PricingSection } from "./_components/pricing-section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Marketing.meta");
  const title = t("pricingTitle");
  const description = t("pricingDescription");

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
        en: "/pricing",
        id: "/pricing",
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function PricingPage() {
  return <PricingSection />;
}
