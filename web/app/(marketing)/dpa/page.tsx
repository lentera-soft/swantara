import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DpaSection } from "./_components/dpa-section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Marketing.meta");
  const title = t("dpaTitle");
  const description = t("dpaDescription");

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
        en: "/dpa",
        id: "/dpa",
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function DpaPage() {
  return <DpaSection />;
}
