"use client";

import type { LucideIcon } from "lucide-react";
import { Search } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/input";
import { PageHeader } from "@/components/page-header";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { cn } from "@/lib/utils";
import { moduleIcons } from "../../_components/module-collapsible";
import {
  navLabel,
  type OrgNavModule,
  orgNavItems,
  orgNavModuleOrder,
} from "../../_components/nav-items";

const moduleHome: Record<OrgNavModule, string> = {
  crm: "/crm",
  products: "/products",
  inventory: "/stock",
  procurement: "/purchases",
  hr: "/employees",
  finance: "/accounting",
  projectManagement: "/projects",
  subscriptions: "/subscriptions",
  sales: "/pos",
  service: "/service-orders",
};

const moduleLabelKey: Record<OrgNavModule, string> = {
  crm: "moduleCrm",
  products: "moduleProducts",
  inventory: "moduleInventory",
  procurement: "moduleProcurement",
  hr: "moduleHr",
  finance: "moduleFinance",
  projectManagement: "moduleProjectManagement",
  subscriptions: "moduleSubscriptions",
  sales: "moduleSales",
  service: "moduleService",
};

const accentClasses = [
  "bg-chart-1/10 text-chart-1 ring-chart-1/20",
  "bg-chart-2/10 text-chart-2 ring-chart-2/20",
  "bg-chart-3/10 text-chart-3 ring-chart-3/20",
  "bg-chart-4/10 text-chart-4 ring-chart-4/20",
  "bg-chart-5/10 text-chart-5 ring-chart-5/20",
];

type LauncherApp = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
};

export function AppLauncher() {
  const { has } = usePermissions();
  const t = useTranslations("Apps");
  const tNav = useTranslations("Nav");
  const [query, setQuery] = useState("");

  function navLabelFor(key: string): string {
    try {
      return (tNav as unknown as (k: string) => string)(key);
    } catch {
      return navLabel(key);
    }
  }

  function moduleLabelFor(mod: OrgNavModule): string {
    try {
      return (t as unknown as (k: string) => string)(moduleLabelKey[mod]);
    } catch {
      return mod;
    }
  }

  const apps: LauncherApp[] = [];
  const dashboard = orgNavItems.find((item) => item.key === "dashboard");
  if (dashboard) {
    apps.push({
      key: dashboard.key,
      label: navLabelFor(dashboard.key),
      href: dashboard.href,
      icon: dashboard.icon,
    });
  }

  for (const mod of orgNavModuleOrder) {
    const items = orgNavItems.filter(
      (item) =>
        item.group === "modules" &&
        item.module === mod &&
        (item.permission == null || has(item.permission)),
    );
    if (items.length === 0) continue;
    apps.push({
      key: mod,
      label: moduleLabelFor(mod),
      href: moduleHome[mod],
      icon: moduleIcons[mod],
    });
  }

  const trimmed = query.trim().toLowerCase();
  const visibleApps = trimmed
    ? apps.filter((app) => app.label.toLowerCase().includes(trimmed))
    : apps;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              className="pl-9"
            />
          </div>
        }
      />

      {visibleApps.length === 0 ? (
        <EmptyState
          icon={Search}
          title={t("noResults")}
          description={t("noResultsDescription")}
          headingLevel={2}
        />
      ) : (
        <ul className="grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
          {visibleApps.map((app, index) => {
            const Icon = app.icon;
            return (
              <li key={app.key}>
                <Link
                  href={app.href}
                  className={cn(
                    "group flex flex-col items-center gap-1.5 rounded-lg p-2 text-center outline-none",
                    "transition-colors hover:bg-muted/50",
                    "focus-visible:ring-3 focus-visible:ring-ring/50",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-12 place-items-center rounded-lg transition-transform duration-200 group-hover:scale-105",
                      accentClasses[index % accentClasses.length],
                    )}
                  >
                    <Icon className="size-6" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="line-clamp-2 text-xs leading-snug font-medium text-pretty text-foreground">
                    {app.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
