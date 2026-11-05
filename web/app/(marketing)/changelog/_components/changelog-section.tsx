"use client";

import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import { splitTitle } from "../../_components/marketing-utils";
import { SwissIndexBadge } from "../../_components/swiss-grid-mark";
import { CHANGELOG_CADENCE, CHANGELOG_RELEASES } from "./changelog-utils";

export function ChangelogSection() {
  const t = useTranslations("Marketing.changelog");

  return (
    <div data-slot="changelog-section">
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

            <div data-gsap="hero-meta" className="flex flex-col justify-end gap-8 lg:col-span-4">
              <p className="text-lg leading-relaxed text-muted-foreground">{t("subtitle")}</p>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button size="lg" shape="pill" className="w-full justify-between px-6" asChild>
                  <Link href="/register">
                    <span>{t("primaryCta")}</span>
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  shape="pill"
                  className="w-full justify-between px-6"
                  asChild
                >
                  <Link href="/contact">
                    <span>{t("secondaryCta")}</span>
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="releases" className="border-t border-border-subtle">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div data-gsap="section-header" className="max-w-2xl">
            <SwissIndexBadge label={t("releasesEyebrow")} />
            <h2 className="mt-4 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              {t("releasesTitle")}
            </h2>
          </div>

          <div data-gsap="grid-stagger" className="mt-12 divide-y divide-border-subtle">
            {CHANGELOG_RELEASES.map((release) => (
              <article
                key={release.id}
                data-gsap-item
                className="grid grid-cols-1 gap-4 py-10 first:pt-0 lg:grid-cols-12 lg:gap-10"
              >
                <div className="space-y-2 lg:col-span-3">
                  <p className="font-mono text-sm font-medium text-primary tabular-nums">
                    {t(release.versionKey)}
                  </p>
                  <p className="text-xs text-muted-foreground">{t(release.dateKey)}</p>
                  <p className="font-mono text-xs text-muted-foreground">{t(release.tagKey)}</p>
                </div>
                <div className="lg:col-span-8 lg:col-start-5">
                  <h3 className="text-xl font-medium tracking-tight text-foreground sm:text-2xl">
                    {t(release.titleKey)}
                  </h3>
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
                    {t(release.descriptionKey)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="cadence" className="border-t border-border-subtle bg-surface-warm">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div data-gsap="section-header" className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SwissIndexBadge label={t("cadenceEyebrow")} />
              <h2 className="mt-4 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                {t("cadenceTitle")}
              </h2>
            </div>

            <ul className="space-y-5 lg:col-span-6 lg:col-start-7">
              {CHANGELOG_CADENCE.map((item) => (
                <li key={item.id} className="flex items-start gap-3 text-base">
                  <span className="mt-1 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Check aria-hidden="true" className="size-3 text-primary" />
                  </span>
                  <span className="text-foreground/85">{t(item.key)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-border-subtle">
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
                <Link href="/register">
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
                <Link href="/product">
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
