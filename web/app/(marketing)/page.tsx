import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { HomeFeaturesSection } from "./_components/home-features-section";
import { HomeHeroSection } from "./_components/home-hero-section";
import { HomePricingFaqSection } from "./_components/home-pricing-faq-section";
import { HomeWorkflowSection } from "./_components/home-workflow-section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Marketing.meta");
  const title = t("homeTitle");
  const description = t("homeDescription");

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
        en: "/",
        id: "/",
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function MarketingHomePage() {
  return (
    <div data-slot="marketing-home-page">
      <HomeHeroSection />
      <HomeFeaturesSection />
      <HomeWorkflowSection />
      <HomePricingFaqSection />
    </div>
  );
}
