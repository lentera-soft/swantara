"use client";

import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import { splitTitle } from "../../_components/marketing-utils";
import { SwissIndexBadge } from "../../_components/swiss-grid-mark";
import { ABOUT_STORY_PARAGRAPHS, ABOUT_TEAM_MEMBERS, ABOUT_VALUES } from "./about-utils";

export function AboutSection() {
  const t = useTranslations("Marketing.about");

  return (
    <div data-slot="about-section">
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

      <section className="border-t border-border-subtle">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div data-gsap="section-header" className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SwissIndexBadge label={t("storyTitle")} />
              <h2 className="mt-4 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                {t("storyTitle")}
              </h2>
            </div>

            <div className="space-y-8 lg:col-span-6 lg:col-start-7">
              {ABOUT_STORY_PARAGRAPHS.map((paragraph) => (
                <p
                  key={paragraph.id}
                  className="text-lg leading-relaxed text-foreground/85 first:text-foreground"
                >
                  {t(paragraph.key)}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border-subtle bg-surface-warm">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div data-gsap="section-header" className="max-w-2xl">
            <SwissIndexBadge label={t("valuesTitle")} />
            <h2 className="mt-4 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              {t("valuesTitle")}
            </h2>
          </div>

          <div
            data-gsap="grid-stagger"
            className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
          >
            {ABOUT_VALUES.map((val) => (
              <div key={val.id} data-gsap-item className="space-y-4">
                <span className="text-xs font-medium text-muted-foreground">{val.code}</span>
                <h3 className="text-xl font-medium tracking-tight text-foreground">
                  {t(val.titleKey)}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {t(val.descriptionKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="careers" className="border-t border-border-subtle">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div data-gsap="section-header" className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <SwissIndexBadge label={t("badge")} />
              <h2 className="mt-4 text-headline text-foreground">
                {splitTitle(t("teamTitle")).map((line, idx) => (
                  <span key={line} className={cn("block", idx > 0 && "text-muted-foreground")}>
                    {line}
                  </span>
                ))}
              </h2>
            </div>
            <div className="flex items-end lg:col-span-5 lg:col-start-8">
              <p className="text-lg leading-relaxed text-muted-foreground">{t("teamSubtitle")}</p>
            </div>
          </div>

          <div
            data-gsap="grid-stagger"
            className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {ABOUT_TEAM_MEMBERS.map((member) => (
              <div
                key={member.id}
                data-gsap-item
                className="rounded-2xl border border-border-subtle bg-background p-6 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-full bg-muted/60 font-medium text-sm">
                    {member.initials}
                  </div>
                  <span className="text-xs text-muted-foreground">{member.location}</span>
                </div>
                <div className="mt-6">
                  <h3 className="text-base font-medium text-foreground">{t(member.nameKey)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t(member.roleKey)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-start justify-between gap-6 rounded-2xl border border-border-subtle bg-muted/30 p-6 sm:p-8 lg:flex-row lg:items-center">
            <div className="space-y-2">
              <h3 className="text-xl font-medium tracking-tight">{t("joinTitle")}</h3>
              <p className="text-sm text-muted-foreground sm:text-base">{t("joinDescription")}</p>
            </div>
            <Button variant="outline" size="lg" shape="pill" className="px-5" asChild>
              <Link href="/contact">
                <span>{t("joinCta")}</span>
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
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
