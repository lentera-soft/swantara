import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ProductSection } from "./_components/product-section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Marketing.meta");
  const title = t("productTitle");
  const description = t("productDescription");

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
        en: "/product",
        id: "/product",
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function ProductPage() {
  return <ProductSection />;
}
