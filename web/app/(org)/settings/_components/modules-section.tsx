"use client";

import {
  Calculator,
  Database,
  Factory,
  FolderKanban,
  Handshake,
  Store,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { Card, CardContent } from "@/components/card";
import { Switch } from "@/components/switch";
import {
  ALL_MODULE_IDS,
  loadEnabledModules,
  type OrgModuleId,
  saveEnabledModules,
} from "@/lib/services/module-registry";

const MODULE_ENTRIES: {
  id: OrgModuleId;
  icon: typeof Handshake;
  colorClass: string;
}[] = [
  {
    id: "crm",
    icon: Handshake,
    colorClass: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  },
  {
    id: "production",
    icon: Factory,
    colorClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  { id: "inventory", icon: Warehouse, colorClass: "bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  {
    id: "procurement",
    icon: Truck,
    colorClass: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  { id: "hr", icon: Users, colorClass: "bg-rose-500/10 text-rose-700 dark:text-rose-300" },
  {
    id: "projectManagement",
    icon: FolderKanban,
    colorClass: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
  },
  {
    id: "finance",
    icon: Calculator,
    colorClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  {
    id: "salesService",
    icon: Store,
    colorClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  {
    id: "reference",
    icon: Database,
    colorClass: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
  },
];

const labelKey = {
  crm: "moduleCrm",
  production: "moduleProduction",
  inventory: "moduleInventory",
  procurement: "moduleProcurement",
  hr: "moduleHr",
  projectManagement: "moduleProjectManagement",
  finance: "moduleFinance",
  salesService: "moduleSalesService",
  reference: "moduleReference",
} as const satisfies Record<OrgModuleId, string>;

const descKey = {
  crm: "descCrm",
  production: "descProduction",
  inventory: "descInventory",
  procurement: "descProcurement",
  hr: "descHr",
  projectManagement: "descProjectManagement",
  finance: "descFinance",
  salesService: "descSalesService",
  reference: "descReference",
} as const satisfies Record<OrgModuleId, string>;

export function ModulesSection({ orgId }: { orgId: string }) {
  const t = useTranslations("Settings");
  const tApps = useTranslations("Apps");
  const [enabled, setEnabled] = useState<Set<OrgModuleId>>(
    () => new Set(loadEnabledModules(orgId)),
  );

  function persist(next: Set<OrgModuleId>) {
    setEnabled(next);
    saveEnabledModules(
      orgId,
      ALL_MODULE_IDS.filter((id) => next.has(id)),
    );
    toast.success(t("modulesSaved"));
  }

  function toggle(id: OrgModuleId, checked: boolean) {
    const next = new Set(enabled);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    if (next.size === 0) {
      toast.error(t("modulesAtLeastOne"));
      return;
    }
    persist(next);
  }

  function reset() {
    persist(new Set(ALL_MODULE_IDS));
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-heading text-lg tracking-tight">{t("modulesTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("modulesDescription")} ·{" "}
              <span className="font-medium text-foreground">
                {t("modulesCount", { enabled: enabled.size, total: ALL_MODULE_IDS.length })}
              </span>
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={reset}>
            {t("modulesReset")}
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {MODULE_ENTRIES.map(({ id, icon: Icon, colorClass }) => (
            <div
              key={id}
              className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 transition-colors hover:border-primary/25"
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${colorClass}`}
              >
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{tApps(labelKey[id])}</span>
                <span className="truncate text-xs text-muted-foreground">{tApps(descKey[id])}</span>
              </span>
              <Switch
                checked={enabled.has(id)}
                onCheckedChange={(checked) => toggle(id, checked === true)}
                aria-label={tApps(labelKey[id])}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
