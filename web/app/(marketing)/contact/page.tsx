import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContactSection } from "./_components/contact-section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Marketing.meta");
  const title = t("contactTitle");
  const description = t("contactDescription");

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
        en: "/contact",
        id: "/contact",
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function ContactPage() {
  return <ContactSection />;
}
