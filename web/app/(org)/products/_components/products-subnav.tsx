"use client";

import { useTranslations } from "next-intl";
import { OrgSubNav } from "@/app/(org)/_components/org-subnav";

const PRODUCT_TABS = [
  { key: "items", href: "/products" },
  { key: "productCategories", href: "/products/categories" },
] as const;

export function ProductsSubNav() {
  const tNav = useTranslations("Nav");
  return <OrgSubNav label={tNav("items")} tabs={PRODUCT_TABS} />;
}
