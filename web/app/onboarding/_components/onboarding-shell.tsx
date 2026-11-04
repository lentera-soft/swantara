"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { SwissBrandMark } from "@/app/(marketing)/_components/swiss-grid-mark";

const HIGHLIGHT_KEYS = ["highlight1", "highlight2", "highlight3"] as const;

export type OnboardingShellProps = {
  children: React.ReactNode;
};

export function OnboardingShell({ children }: OnboardingShellProps) {
  const t = useTranslations("Onboarding");
  const tx = t as unknown as (key: string, values?: Record<string, string | number>) => string;

  return (
    <div data-slot="onboarding-shell" className="grid min-h-screen grid-cols-1 lg:grid-cols-12">
      <aside className="relative col-span-1 hidden flex-col justify-between overflow-hidden border-r border-border bg-surface-warm px-12 py-10 lg:col-span-5 lg:flex xl:px-16">
        <div
          aria-hidden="true"
          className="bg-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_75%)]"
        />
        <header className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SwissBrandMark className="size-6" />
            <span className="font-heading text-lg font-medium tracking-tight">Swantara</span>
          </div>
          <span className="text-label uppercase text-muted-foreground">{tx("setupBadge")}</span>
        </header>

        <div className="relative max-w-md">
          <h2 className="font-heading text-5xl leading-tight font-medium tracking-tight text-balance">
            {tx("setupCompany")}
          </h2>
          <p className="mt-5 text-body-lg text-muted-foreground">{tx("setupSubtitle")}</p>
          <ul className="mt-10 flex flex-col gap-4">
            {HIGHLIGHT_KEYS.map((key) => (
              <li key={key} className="flex items-start gap-3 text-sm leading-relaxed">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3" aria-hidden="true" />
                </span>
                <span className="text-foreground/75">{tx(key)}</span>
              </li>
            ))}
          </ul>
        </div>

        <footer className="relative text-label uppercase text-muted-foreground">
          {tx("secureNote")}
        </footer>
      </aside>

      <div className="col-span-1 flex flex-col items-center justify-center px-5 py-10 sm:px-8 lg:col-span-7">
        <header className="mb-8 flex w-full max-w-md items-center justify-between lg:hidden">
          <div className="flex items-center gap-2.5">
            <SwissBrandMark className="size-6" />
            <span className="font-heading text-lg font-medium tracking-tight">Swantara</span>
          </div>
          <span className="text-label uppercase text-muted-foreground">{tx("setupBadge")}</span>
        </header>
        {children}
      </div>
    </div>
  );
}
