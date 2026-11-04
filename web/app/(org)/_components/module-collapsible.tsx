"use client";

import {
  Briefcase,
  Calculator,
  ChevronDown,
  Database,
  Handshake,
  type LucideIcon,
  Package,
  Receipt,
  Truck,
  Users,
  Warehouse,
  Wrench,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/app-shell";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/collapsible";
import { cn } from "@/lib/utils";
import type { OrgNavItem, OrgNavModule } from "./nav-items";
import { SidebarTree } from "./sidebar-tree";

export const moduleKey: Record<OrgNavModule, string> = {
  crm: "Customer",
  production: "Produksi",
  inventory: "Persediaan",
  procurement: "Pengadaan",
  hr: "HR",
  finance: "Keuangan",
  reference: "Referensi",
  projectManagement: "Manajemen Proyek",
  sales: "Penjualan",
  service: "Layanan",
};

export const moduleIcons: Record<OrgNavModule, LucideIcon> = {
  crm: Handshake,
  production: Package,
  inventory: Warehouse,
  procurement: Truck,
  hr: Users,
  finance: Calculator,
  reference: Database,
  projectManagement: Briefcase,
  sales: Receipt,
  service: Wrench,
};

export type ModuleCollapsibleProps = {
  mod: OrgNavModule;
  items: OrgNavItem[];
};

export function ModuleCollapsible({ mod, items }: ModuleCollapsibleProps) {
  const pathname = usePathname();
  const { state, isMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const tNav = useTranslations("Nav");
  const tModules = useTranslations("NavModules");
  const ModuleIcon = moduleIcons[mod];
  const moduleLabel = (() => {
    try {
      return tModules(mod);
    } catch {
      return moduleKey[mod];
    }
  })();
  void tNav;
  const isModuleActive = items.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  const [open, setOpen] = useState(isModuleActive);

  useEffect(() => {
    if (isModuleActive) setOpen(true);
  }, [isModuleActive]);

  if (collapsed) {
    return (
      <div data-slot="module-section">
        <SidebarGroup className="gap-1.5">
          <SidebarGroupContent>
            <SidebarTree items={items} />
          </SidebarGroupContent>
        </SidebarGroup>
      </div>
    );
  }

  return (
    <div data-slot="module-section">
      <Collapsible open={open} onOpenChange={setOpen}>
        <SidebarGroup className="gap-1.5">
          <CollapsibleTrigger
            render={<SidebarGroupLabel />}
            nativeButton={false}
            aria-label={moduleLabel}
            title={moduleLabel}
            className={cn(
              "flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-lg px-3 text-[13px] font-normal text-sidebar-foreground/70",
              "justify-between",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              "focus-visible:ring-3 focus-visible:ring-sidebar-ring/50",
              "[data-panel-open]:bg-sidebar-accent [data-panel-open]:text-sidebar-foreground",
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <ModuleIcon className="size-[18px] shrink-0" aria-hidden="true" />
              <span className="truncate">{moduleLabel}</span>
            </span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 transition-transform duration-200 [[data-panel-open]>&]:rotate-180",
              )}
              aria-hidden="true"
            />
          </CollapsibleTrigger>
          <CollapsibleContent
            className={cn(
              "grid transition-all duration-200 ease-out",
              "data-[closed]:grid-rows-[0fr] data-[open]:grid-rows-[1fr]",
              "data-[closed]:[&>div]:overflow-hidden",
              "data-[closed]:[&>div]:opacity-0 data-[open]:[&>div]:opacity-100",
              "data-[closed]:[&>div]:transition-all data-[open]:[&>div]:transition-all",
              "data-[closed]:[&>div]:duration-200 data-[open]:[&>div]:duration-200",
              "data-[closed]:[&>div]:delay-0 data-[open]:[&>div]:delay-75",
            )}
          >
            <div className="min-h-0">
              <SidebarGroupContent className="ml-2 border-l border-sidebar-border/50 pl-2">
                <SidebarTree items={items} />
              </SidebarGroupContent>
            </div>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    </div>
  );
}
