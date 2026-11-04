"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/app-shell";
import type { OrgNavItem } from "./nav-items";
import { navLabel } from "./nav-items";

export type SidebarTreeProps = {
  items: OrgNavItem[];
};

export function SidebarTree({ items }: SidebarTreeProps) {
  const pathname = usePathname();
  const tNav = useTranslations("Nav");
  const { isMobile, setOpenMobile } = useSidebar();

  function getLabel(key: string): string {
    const tNavAny = tNav as unknown as {
      (k: string): string;
      has(k: string): boolean;
    };
    if (tNavAny.has(key)) {
      return tNavAny(key);
    }
    return navLabel(key);
  }

  const activeHref = items
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .reduce<string | null>(
      (mostSpecific, item) =>
        item.href.length > (mostSpecific?.length ?? 0) ? item.href : mostSpecific,
      null,
    );

  return (
    <SidebarMenu>
      {items.map((item) => {
        const Icon = item.icon;
        const href = item.href;
        const label = getLabel(item.key);
        const isActive = href === activeHref;
        return (
          <SidebarMenuItem key={item.key}>
            <SidebarMenuButton asChild isActive={isActive} label={label}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  if (isMobile) setOpenMobile(false);
                }}
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
