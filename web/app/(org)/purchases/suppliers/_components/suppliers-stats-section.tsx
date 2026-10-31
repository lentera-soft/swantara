"use client";

import { FolderKanban, Store, Truck, UserX } from "lucide-react";
import { useTranslations } from "next-intl";
import { MetricGrid } from "@/components/metric-grid";
import { StatCard } from "@/components/stat-card";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { Contact } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { formatNumber } from "@/lib/utils";

export function SuppliersStats() {
  const t = useTranslations("Purchases");
  const contactsQuery = useOrgListQuery<{ contacts: Contact[] }, { size: number }>(
    "contacts",
    (organizationId, params) => getSwantaraService().contacts.list(organizationId, params),
    { size: 100 },
  );

  const contacts = (contactsQuery.data?.contacts ?? []).filter((contact) => contact.isSupplier);
  const activeContacts = contacts.filter((p) => p.active);
  const inactiveContacts = contacts.filter((p) => !p.active);
  const categories = new Set(
    contacts.map((p) => p.industry).filter((value): value is string => Boolean(value)),
  );

  function statLabel(key: string): string {
    try {
      return (t as unknown as (k: string) => string)(`supplierStat.${key}`);
    } catch {
      return key;
    }
  }

  const stats: Array<{ key: string; value: string; icon: typeof Truck }> = [
    { key: "total", value: formatNumber(contacts.length), icon: Truck },
    { key: "active", value: formatNumber(activeContacts.length), icon: Store },
    { key: "inactive", value: formatNumber(inactiveContacts.length), icon: UserX },
    { key: "categories", value: formatNumber(categories.size), icon: FolderKanban },
  ];

  return (
    <MetricGrid>
      {stats.map((stat) => (
        <StatCard key={stat.key} label={statLabel(stat.key)} value={stat.value} icon={stat.icon} />
      ))}
    </MetricGrid>
  );
}
