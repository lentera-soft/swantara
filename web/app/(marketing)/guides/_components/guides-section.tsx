"use client";

import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import { splitTitle } from "../../_components/marketing-utils";
import { SwissIndexBadge } from "../../_components/swiss-grid-mark";
import { GUIDE_COLLECTIONS, GUIDE_TOPICS } from "./guides-utils";

export function GuidesSection() {
  const t = useTranslations("Marketing.guides");

  return (
    <div data-slot="guides-section">
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

      <section id="collections" className="border-t border-border-subtle">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div data-gsap="section-header" className="max-w-2xl">
            <SwissIndexBadge label={t("collectionsEyebrow")} />
            <h2 className="mt-4 text-headline text-foreground">
              {splitTitle(t("collectionsTitle")).map((line, idx) => (
                <span key={line} className={cn("block", idx > 0 && "text-muted-foreground")}>
                  {line}
                </span>
              ))}
            </h2>
          </div>

          <div
            data-gsap="grid-stagger"
            className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {GUIDE_COLLECTIONS.map((guide) => (
              <div
                key={guide.id}
                data-gsap-item
                className="rounded-2xl border border-border-subtle bg-background p-6 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{guide.code}</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {t(guide.readTimeKey)}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-medium text-foreground">{t(guide.titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(guide.descriptionKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="topics" className="border-t border-border-subtle bg-surface-warm">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div data-gsap="section-header" className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SwissIndexBadge label={t("topicsEyebrow")} />
              <h2 className="mt-4 text-headline text-foreground">
                {splitTitle(t("topicsTitle")).map((line, idx) => (
                  <span key={line} className={cn("block", idx > 0 && "text-muted-foreground")}>
                    {line}
                  </span>
                ))}
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                {t("topicsSubtitle")}
              </p>
              <p className="mt-4 text-sm font-medium text-primary">{t("guidesNote")}</p>
            </div>

            <div
              data-gsap="grid-stagger"
              className="grid grid-cols-1 gap-px rounded-2xl border border-border-subtle bg-border/40 sm:grid-cols-2 lg:col-span-6 lg:col-start-7"
            >
              {GUIDE_TOPICS.map((topic) => (
                <div
                  key={topic.id}
                  data-gsap-item
                  className="bg-background p-6 transition-colors hover:bg-muted/30"
                >
                  <span className="text-xs text-muted-foreground tabular-nums">{topic.index}</span>
                  <div className="mt-4">
                    <p className="text-base font-medium text-foreground">{topic.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{topic.spec}</p>
                  </div>
                </div>
              ))}
            </div>
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
                <Link href="/support">
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
