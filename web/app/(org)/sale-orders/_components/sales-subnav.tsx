"use client";

import { useTranslations } from "next-intl";
import { OrgSubNav } from "@/app/(org)/_components/org-subnav";

const SALES_TABS = [
  { key: "quotes", href: "/sale-quotes" },
  { key: "sales", href: "/sale-orders" },
] as const;

export function SalesSubNav() {
  const t = useTranslations("Sales");
  return <OrgSubNav label={t("subnavLabel")} tabs={SALES_TABS} />;
}
