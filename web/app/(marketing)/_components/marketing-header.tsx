"use client";

import { Menu, Moon, Sun, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { cn } from "@/lib/utils";
import { DARK, useThemeStore } from "@/stores/theme.store";
import { MARKETING_NAV_ITEMS } from "./marketing-utils";
import { SwissBrandMark } from "./swiss-grid-mark";

export function MarketingHeader() {
  const pathname = usePathname();
  const tBrand = useTranslations("Marketing.brand");
  const tNav = useTranslations("Marketing.nav");
  const tActions = useTranslations("Marketing.actions");
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const hydrateTheme = useThemeStore((state) => state.hydrateTheme);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    hydrateTheme();
  }, [hydrateTheme]);

  function isActivePath(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header
      data-slot="marketing-header"
      className="fixed inset-x-0 top-4 z-header px-4 sm:top-5 sm:px-6 lg:px-8"
    >
      <div
        data-gsap="hero-nav"
        className="flex h-14 items-center justify-between rounded-full border border-border/40 bg-background/75 px-2 backdrop-blur-xl"
      >
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 pl-4 text-foreground transition-opacity hover:opacity-70"
        >
          <SwissBrandMark className="size-5 transition-transform duration-300 group-hover:rotate-90" />
          <span className="text-base font-medium tracking-tight">{tBrand("name")}</span>
        </Link>

        <nav
          aria-label={tBrand("name")}
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:inline-flex"
        >
          {MARKETING_NAV_ITEMS.map((item) => {
            const active = isActivePath(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {tNav(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1 pr-2">
          <LocaleSwitcher variant="ghost" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex"
            onClick={toggleTheme}
            aria-label={tActions("toggleTheme")}
          >
            {resolvedTheme === DARK ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          </Button>

          <div className="hidden items-center gap-1 pl-1 sm:flex">
            <Button variant="ghost" shape="pill" asChild>
              <Link href="/login">{tActions("signIn")}</Link>
            </Button>
            <Button variant="default" shape="pill" className="px-4" asChild>
              <Link href="/register">{tActions("startFree")}</Link>
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? tActions("closeMenu") : tActions("openMenu")}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div
          data-slot="marketing-mobile-nav"
          className="mt-2 rounded-2xl border border-border/40 bg-background/95 p-3 backdrop-blur-xl md:hidden"
        >
          <nav aria-label={tBrand("name")} className="flex flex-col">
            {MARKETING_NAV_ITEMS.map((item) => {
              const active = isActivePath(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-4 py-2.5 text-base transition-colors",
                    active ? "bg-muted font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {tNav(item.key)}
                </Link>
              );
            })}
            <div className="mt-2 flex flex-col gap-2 border-t border-border-subtle pt-2">
              <Button variant="outline" shape="pill" className="w-full" asChild>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  {tActions("signIn")}
                </Link>
              </Button>
              <Button variant="default" shape="pill" className="w-full" asChild>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  {tActions("startFree")}
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
