"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/button";
import { CtaPair, PageHero, Section, SectionHeader } from "../../_components/swiss-layout";
import { ABOUT_STORY_PARAGRAPHS, ABOUT_TEAM_MEMBERS, ABOUT_VALUES } from "./about-utils";

export function AboutSection() {
  const t = useTranslations("Marketing.about");

  return (
    <div data-slot="about-section">
      <PageHero eyebrow={t("badge")} title={t("title")} lead={t("subtitle")} />

      <Section>
        <SectionHeader eyebrow={t("storyTitle")} title={t("storyTitle")} />
        <div data-gsap="grid-stagger" className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {ABOUT_STORY_PARAGRAPHS.map((paragraph) => (
            <div key={paragraph.id} data-gsap-item className="border-t border-border-subtle pt-6">
              <span className="text-xs font-medium text-primary tabular-nums">
                {paragraph.index}
              </span>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-foreground/85">
                {t(paragraph.key)}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="warm">
        <SectionHeader eyebrow={t("valuesTitle")} title={t("valuesTitle")} />
        <div
          data-gsap="grid-stagger"
          className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
        >
          {ABOUT_VALUES.map((val) => (
            <div
              key={val.id}
              data-gsap-item
              className="flex flex-col rounded-2xl border border-border-subtle bg-background p-6 sm:p-8"
            >
              <span className="text-label text-muted-foreground uppercase">{val.code}</span>
              <h3 className="mt-8 text-xl font-medium tracking-tight text-foreground">
                {t(val.titleKey)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t(val.descriptionKey)}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="careers">
        <SectionHeader eyebrow={t("badge")} title={t("teamTitle")} lead={t("teamSubtitle")} />

        <div
          data-gsap="grid-stagger"
          className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
        >
          {ABOUT_TEAM_MEMBERS.map((member) => (
            <div
              key={member.id}
              data-gsap-item
              className="rounded-2xl border border-border-subtle bg-background p-6 transition-colors hover:bg-muted/30 sm:p-8"
            >
              <div className="flex items-center justify-between">
                <div className="flex size-11 items-center justify-center rounded-full bg-muted/60 font-medium text-sm">
                  {member.initials}
                </div>
                <span className="text-label text-muted-foreground uppercase">
                  {member.location}
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-base font-medium text-foreground">{t(member.nameKey)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t(member.roleKey)}</p>
              </div>
            </div>
          ))}
        </div>

        <div
          data-gsap="fade-up"
          className="mt-6 grid grid-cols-1 gap-6 rounded-2xl border border-border-subtle bg-background p-6 sm:p-8 lg:grid-cols-12 lg:items-center lg:gap-8"
        >
          <div className="space-y-2 lg:col-span-7">
            <h3 className="text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
              {t("joinTitle")}
            </h3>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
              {t("joinDescription")}
            </p>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <Button
              variant="outline"
              size="lg"
              shape="pill"
              className="w-full justify-between px-6"
              asChild
            >
              <Link href="/contact">
                <span>{t("joinCta")}</span>
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Section>

      <Section tone="warm">
        <SectionHeader eyebrow={t("badge")} title={t("ctaTitle")} lead={t("ctaSubtitle")}>
          <CtaPair
            primary={{ href: "/contact", label: t("ctaPrimary") }}
            secondary={{ href: "/product", label: t("ctaSecondary") }}
          />
        </SectionHeader>
      </Section>
    </div>
  );
}
