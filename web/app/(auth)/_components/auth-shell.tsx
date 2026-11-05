"use client";

import { ArrowLeft, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { splitTitle } from "@/app/(marketing)/_components/marketing-utils";
import { SwissBrandMark } from "@/app/(marketing)/_components/swiss-grid-mark";
import { useSwissAnimations } from "@/app/(marketing)/_components/use-swiss-animations";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { cn } from "@/lib/utils";
import { DARK, useThemeStore } from "@/stores/theme.store";

const AUTH_SHELL_POINTS = ["authShellPoint1", "authShellPoint2", "authShellPoint3"] as const;

export type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
};

export default function AuthShell({ title, subtitle = "", children, className }: AuthShellProps) {
  const t = useTranslations("Auth");
  const tx = t as unknown as (key: string) => string;
  const scopeRef = useRef<HTMLDivElement>(null);
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const hydrateTheme = useThemeStore((state) => state.hydrateTheme);

  useSwissAnimations(scopeRef);

  useEffect(() => {
    hydrateTheme();
  }, [hydrateTheme]);

  return (
    <div
      ref={scopeRef}
      data-slot="auth-shell"
      className="relative flex min-h-screen flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground"
    >
      <header className="absolute inset-x-0 top-4 z-header px-4 sm:top-5 sm:px-6 lg:px-8">
        <div
          data-gsap="hero-nav"
          className="flex h-14 items-center justify-between rounded-full border border-border/40 bg-background/75 px-2 backdrop-blur-xl"
        >
          <Link
            href="/"
            className="group inline-flex items-center gap-2.5 pl-4 text-foreground transition-opacity hover:opacity-70"
          >
            <SwissBrandMark className="size-5 transition-transform duration-300 group-hover:rotate-90" />
            <span className="text-base font-medium tracking-tight">Swantara</span>
          </Link>
          <div className="flex items-center gap-1 pr-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={tx("authShellToggleTheme")}
            >
              {resolvedTheme === DARK ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            </Button>
            <Button variant="ghost" shape="pill" asChild>
              <Link href="/">
                <ArrowLeft aria-hidden="true" className="size-4" />
                <span>{tx("authShellBackToSite")}</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-12">
        <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-border-subtle bg-surface-warm px-12 pt-36 pb-12 lg:col-span-5 lg:flex xl:px-16">
          <div
            aria-hidden="true"
            className="bg-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_75%)]"
          />
          <div className="relative max-w-md">
            <p data-gsap="hero-meta" className="text-label text-muted-foreground uppercase">
              {tx("authShellBadge")}
            </p>
            <div
              data-gsap="hero-title"
              className="mt-5 text-4xl leading-[1.05] font-medium tracking-tight text-balance text-foreground xl:text-5xl"
            >
              {splitTitle(tx("authShellTitle")).map((line, idx) => (
                <span key={line} className={cn("block", idx > 0 && "text-muted-foreground")}>
                  {line}
                </span>
              ))}
            </div>
            <p data-gsap="hero-meta" className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {tx("authShellSubtitle")}
            </p>
            <ul data-gsap="hero-meta" className="mt-10 flex flex-col border-t border-border-subtle">
              {AUTH_SHELL_POINTS.map((key) => (
                <li
                  key={key}
                  className="flex items-center gap-3 border-b border-border-subtle py-4 text-base leading-relaxed"
                >
                  <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="text-foreground/85">{tx(key)}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative text-sm text-muted-foreground">{tx("authShellNote")}</p>
        </aside>

        <div className="flex flex-col items-center justify-center px-5 pt-28 pb-12 sm:px-8 lg:col-span-7 lg:pt-32">
          <div data-gsap="hero-meta" className="w-full max-w-md">
            <p className="mb-5 text-label text-muted-foreground uppercase lg:hidden">
              {tx("authShellBadge")}
            </p>
            <Card
              className={cn(
                "w-full rounded-2xl border-border-subtle [--card-spacing:--spacing(8)]",
                "[&_[data-slot=input-group]]:rounded-xl [&_[data-slot=input]]:rounded-xl [&_[data-slot=phone-input]]:rounded-xl",
                className,
              )}
            >
              <header className="flex flex-col gap-2 px-(--card-spacing)">
                <h1 className="text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
                  {title.trim()}
                </h1>
                {subtitle.trim() ? (
                  <p className="text-base leading-relaxed text-muted-foreground">
                    {subtitle.trim()}
                  </p>
                ) : null}
              </header>
              <div className="flex flex-col gap-4 px-(--card-spacing)">{children}</div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
