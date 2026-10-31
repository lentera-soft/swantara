import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AboutSection } from "./_components/about-section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Marketing.meta");
  const title = t("aboutTitle");
  const description = t("aboutDescription");

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
        en: "/about",
        id: "/about",
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function AboutPage() {
  return <AboutSection />;
}
