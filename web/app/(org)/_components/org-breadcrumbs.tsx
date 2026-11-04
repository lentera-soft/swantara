"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Breadcrumb, type BreadcrumbItem } from "@/components/breadcrumb";
import { humanizeKey } from "@/lib/utils/case";
import { navLabel, orgNavItems } from "./nav-items";

export function OrgBreadcrumbs() {
  const pathname = usePathname();
  const tNav = useTranslations("Nav");
  const tCrumb = useTranslations("Breadcrumbs");

  const tNavAny = tNav as unknown as {
    (key: string): string;
    has(key: string): boolean;
  };

  function translatedNavLabel(key: string): string {
    if (tNavAny.has(key)) {
      return tNavAny(key);
    }
    return navLabel(key);
  }

  function resolveSegmentLabel(segment: string): string {
    const key = segment.replace(/-([a-z0-9])/g, (_match, char: string) => char.toUpperCase());
    if (tNavAny.has(key)) {
      return tNavAny(key);
    }
    return humanizeKey(segment);
  }

  const trail = pathname.split("/").filter(Boolean);
  if (trail.length === 0) {
    return null;
  }
  const items: BreadcrumbItem[] = [
    {
      label: tCrumb("home"),
      href: trail[0] === "dashboard" ? undefined : "/dashboard",
    },
  ];

  for (let i = 1; i <= trail.length; i++) {
    const prefix = `/${trail.slice(0, i).join("/")}`;
    const match = orgNavItems.find((item) => item.href === prefix);
    const isLast = i === trail.length;
    const label = match ? translatedNavLabel(match.key) : resolveSegmentLabel(trail[i - 1]!);
    items.push({
      label,
      href: isLast ? undefined : prefix,
    });
  }

  return <Breadcrumb items={items} />;
}
