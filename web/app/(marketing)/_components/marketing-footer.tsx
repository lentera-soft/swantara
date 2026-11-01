"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { SwissBrandMark } from "./swiss-grid-mark";

const FOOTER_GROUPS = [
  {
    id: "product",
    titleKey: "product",
    links: [
      { id: "features", labelKey: "features", href: "/product" },
      { id: "pricing", labelKey: "pricing", href: "/pricing" },
      { id: "security", labelKey: "security", href: "/product#security" },
    ],
  },
  {
    id: "company",
    titleKey: "company",
    links: [
      { id: "about", labelKey: "about", href: "/about" },
      { id: "careers", labelKey: "careers", href: "/about#careers" },
      { id: "contact", labelKey: "contact", href: "/contact" },
    ],
  },
  {
    id: "resources",
    titleKey: "resources",
    links: [
      { id: "guides", labelKey: "guides", href: "/product" },
      { id: "changelog", labelKey: "changelog", href: "/product#modules" },
      { id: "support", labelKey: "support", href: "/contact" },
    ],
  },
  {
    id: "legal",
    titleKey: "legal",
    links: [
      { id: "privacy", labelKey: "privacy", href: "/licenses" },
      { id: "terms", labelKey: "terms", href: "/licenses" },
      { id: "dpa", labelKey: "dpa", href: "/contact" },
    ],
  },
] as const;

const CURRENT_YEAR = 2026;

export function MarketingFooter() {
  const tBrand = useTranslations("Marketing.brand");
  const tFooter = useTranslations("Marketing.footer");

  return (
    <footer
      data-slot="marketing-footer"
      className="border-t border-border-subtle bg-surface-sunken"
    >
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-5">
            <div className="flex items-center gap-2.5">
              <SwissBrandMark className="size-5" />
              <span className="text-lg font-medium tracking-tight">{tBrand("name")}</span>
            </div>
            <p className="max-w-sm text-base leading-relaxed text-muted-foreground">
              {tBrand("description")}
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-background px-3 py-1.5 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
              <span>{tFooter("status")}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-7">
            {FOOTER_GROUPS.map((group) => (
              <div key={group.id} className="space-y-4">
                <h2 className="text-xs font-medium tracking-wide text-foreground/80">
                  {tFooter(group.titleKey)}
                </h2>
                <ul className="flex flex-col gap-2.5">
                  {group.links.map((link) => (
                    <li key={link.id}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {tFooter(link.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-3 border-t border-border-subtle pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>{tFooter("copyright", { year: CURRENT_YEAR })}</p>
          <p>{tFooter("madeIn")}</p>
        </div>
      </div>
    </footer>
  );
}
