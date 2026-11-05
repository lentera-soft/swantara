"use client";

import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import { splitTitle } from "../../_components/marketing-utils";
import { SwissIndexBadge } from "../../_components/swiss-grid-mark";
import { CAREERS_BENEFITS, CAREERS_PROCESS, CAREERS_ROLES, CAREERS_VALUES } from "./careers-utils";

export function CareersSection() {
  const t = useTranslations("Marketing.careers");

  return (
    <div data-slot="careers-section">
      <section className="overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-12 lg:px-8 lg:pt-24 lg:pb-16">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p data-gsap="hero-meta" className="text-label text-muted-foreground uppercase">
                {t("badge")}
              </p>
              <h1
                data-gsap="hero-title"
                className="mt-5 text-display max-w-4xl font-medium text-foreground"
              >
                {splitTitle(t("title")).map((line, idx) => (
                  <span key={line} className={cn("block", idx > 0 && "text-muted-foreground")}>
                    {line}
                  </span>
                ))}
              </h1>
            </div>

            <div data-gsap="hero-meta" className="flex items-end lg:col-span-4">
              <p className="text-lg leading-relaxed text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="life" className="border-t border-border-subtle bg-surface-warm">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div data-gsap="section-header" className="max-w-2xl">
            <SwissIndexBadge label={t("whyEyebrow")} />
            <h2 className="mt-4 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              {t("whyTitle")}
            </h2>
          </div>

          <div
            data-gsap="grid-stagger"
            className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
          >
            {CAREERS_VALUES.map((value) => (
              <div key={value.id} data-gsap-item className="space-y-4">
                <span className="text-xs font-medium text-muted-foreground">{value.index}</span>
                <h3 className="text-xl font-medium tracking-tight text-foreground">
                  {t(value.titleKey)}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {t(value.descriptionKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="roles" className="border-t border-border-subtle">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div data-gsap="section-header" className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <SwissIndexBadge label={t("rolesEyebrow")} />
              <h2 className="mt-4 text-headline text-foreground">
                {splitTitle(t("rolesTitle")).map((line, idx) => (
                  <span key={line} className={cn("block", idx > 0 && "text-muted-foreground")}>
                    {line}
                  </span>
                ))}
              </h2>
            </div>
            <div className="flex items-end lg:col-span-5 lg:col-start-8">
              <p className="text-lg leading-relaxed text-muted-foreground">{t("rolesSubtitle")}</p>
            </div>
          </div>

          <div className="mt-12 overflow-hidden rounded-2xl border border-border-subtle bg-surface-raised">
            <div className="grid grid-cols-12 gap-2 border-b border-border/40 px-5 py-3 text-xs font-medium text-muted-foreground">
              <span className="col-span-3">{t("teamColumn")}</span>
              <span className="col-span-5">{t("rolesEyebrow")}</span>
              <span className="col-span-2">{t("locationColumn")}</span>
              <span className="col-span-2 text-right">{t("typeColumn")}</span>
            </div>
            <div data-gsap="grid-stagger" className="divide-y divide-border/30">
              {CAREERS_ROLES.map((role) => (
                <Link
                  key={role.id}
                  data-gsap-item
                  href="/contact"
                  aria-label={`${role.title} — ${t("applyCta")}`}
                  className="group grid grid-cols-12 items-center gap-2 px-5 py-4 text-sm transition-colors hover:bg-muted/30"
                >
                  <span className="col-span-3 font-mono text-xs text-muted-foreground">
                    {role.team}
                  </span>
                  <span className="col-span-5 flex items-center gap-1.5 truncate font-medium text-foreground">
                    {role.title}
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-3.5 shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </span>
                  <span className="col-span-2 text-xs text-muted-foreground">{role.location}</span>
                  <span className="col-span-2 text-right text-xs text-muted-foreground">
                    {role.type}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="process" className="border-t border-border-subtle">
        <div className="mx-auto max-w-7xl px-6 pb-20 lg:px-8 lg:pb-28">
          <div data-gsap="section-header" className="max-w-2xl">
            <SwissIndexBadge label={t("processEyebrow")} />
            <h2 className="mt-4 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              {t("processTitle")}
            </h2>
          </div>

          <div data-gsap="grid-stagger" className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {CAREERS_PROCESS.map((step) => (
              <div
                key={step.id}
                data-gsap-item
                className="rounded-2xl border border-border-subtle bg-background p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-primary tabular-nums">{step.index}</span>
                  <span className="text-xs font-medium text-muted-foreground">{step.code}</span>
                </div>
                <h3 className="mt-4 text-base font-medium text-foreground">{t(step.titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(step.descriptionKey)}
                </p>
              </div>
            ))}
          </div>

          <div
            data-gsap="grid-stagger"
            className="mt-8 grid grid-cols-2 gap-px rounded-2xl border border-border-subtle bg-border/40 sm:grid-cols-3"
          >
            {CAREERS_BENEFITS.map((benefit) => (
              <div
                key={benefit.id}
                data-gsap-item
                className="flex items-center gap-3 bg-background px-5 py-4"
              >
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {benefit.index}
                </span>
                <p className="text-sm font-medium text-foreground">{t(benefit.key)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border-subtle bg-surface-warm">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div
            data-gsap="section-header"
            className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12"
          >
            <div className="lg:col-span-8">
              <SwissIndexBadge label={t("badge")} />
              <h2 className="mt-4 text-headline text-foreground">
                {splitTitle(t("ctaTitle")).map((line, idx) => (
                  <span key={line} className={cn("block", idx > 0 && "text-muted-foreground")}>
                    {line}
                  </span>
                ))}
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                {t("ctaSubtitle")}
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:col-span-4">
              <Button size="lg" shape="pill" className="w-full justify-between px-5" asChild>
                <Link href="/contact">
                  <span>{t("ctaPrimary")}</span>
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                shape="pill"
                className="w-full justify-between px-5"
                asChild
              >
                <Link href="/about">
                  <span>{t("ctaSecondary")}</span>
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
