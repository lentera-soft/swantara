"use client";

import { useTranslations } from "next-intl";
import { OrgSubNav } from "@/app/(org)/_components/org-subnav";

const SERVICE_TABS = [{ key: "service", href: "/service-orders" }] as const;

export function ServiceSubNav() {
  const t = useTranslations("Service");
  return <OrgSubNav label={t("title")} tabs={SERVICE_TABS} />;
}
