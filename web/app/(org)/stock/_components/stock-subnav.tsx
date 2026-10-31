"use client";

import { useTranslations } from "next-intl";
import { OrgSubNav } from "@/app/(org)/_components/org-subnav";

const STOCK_TABS = [{ key: "overview", href: "/stock" }] as const;

export function StockSubNav() {
  const tNav = useTranslations("Nav");
  return <OrgSubNav label={tNav("stock")} tabs={STOCK_TABS} />;
}
