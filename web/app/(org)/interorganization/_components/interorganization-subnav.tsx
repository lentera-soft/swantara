"use client";

import { useTranslations } from "next-intl";
import { OrgSubNav } from "@/app/(org)/_components/org-subnav";

const INTERORGANIZATION_TABS = [
  { key: "rules", href: "/interorganization" },
  { key: "transactions", href: "/interorganization/transactions" },
] as const;

export function InterorganizationSubNav() {
  const t = useTranslations("Interorganization");
  const tNav = useTranslations("Nav");
  return (
    <OrgSubNav
      label={tNav("interorganization")}
      tabs={INTERORGANIZATION_TABS.map((tab) => ({
        key: tab.key,
        href: tab.href,
        label: t(tab.key === "rules" ? "tabRules" : "tabTransactions"),
      }))}
    />
  );
}
