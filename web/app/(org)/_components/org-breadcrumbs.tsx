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

  function translatedNavLabel(key: string): string {
    try {
      return (tNav as unknown as (k: string) => string)(key);
    } catch {
      return navLabel(key);
    }
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

  const settingsSubPageKeys = new Set(["profile"]);
  const productsSubPageKeys = new Set(["recipes", "categories", "price-books", "supplier-catalog"]);
  for (let i = 1; i <= trail.length; i++) {
    const prefix = `/${trail.slice(0, i).join("/")}`;
    const match = orgNavItems.find((item) => item.href === prefix);
    const isLast = i === trail.length;
    let label: string;
    if (match) {
      label = translatedNavLabel(match.key);
    } else if (trail[0] === "settings" && settingsSubPageKeys.has(trail[i - 1]!)) {
      try {
        label = humanizeKey(String(trail[i - 1]!));
      } catch {
        label = trail[i - 1]!;
      }
    } else if (trail[0] === "products" && productsSubPageKeys.has(trail[i - 1]!)) {
      label = translatedNavLabel(String(trail[i - 1]!));
    } else {
      label = prefix;
    }
    items.push({
      label,
      href: isLast ? undefined : prefix,
    });
  }

  return <Breadcrumb items={items} />;
}
