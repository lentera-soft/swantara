"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CtaPair, Eyebrow, PageHero, Section, SectionHeader } from "../../_components/swiss-layout";
import { CAREERS_BENEFITS, CAREERS_PROCESS, CAREERS_ROLES, CAREERS_VALUES } from "./careers-utils";

export function CareersSection() {
  const t = useTranslations("Marketing.careers");

  return (
    <div data-slot="careers-section">
      <PageHero eyebrow={t("badge")} title={t("title")} lead={t("subtitle")} />

      <Section id="life" tone="warm">
        <SectionHeader eyebrow={t("whyEyebrow")} title={t("whyTitle")} />
        <div
          data-gsap="grid-stagger"
          className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
        >
          {CAREERS_VALUES.map((value) => (
            <div
              key={value.id}
              data-gsap-item
              className="flex flex-col rounded-2xl border border-border-subtle bg-background p-6 sm:p-8"
            >
              <span className="text-xs font-medium text-primary tabular-nums">{value.index}</span>
              <h3 className="mt-8 text-xl font-medium tracking-tight text-foreground">
                {t(value.titleKey)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t(value.descriptionKey)}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="roles">
        <SectionHeader
          eyebrow={t("rolesEyebrow")}
          title={t("rolesTitle")}
          lead={t("rolesSubtitle")}
        />

        <div
          data-gsap="frame"
          className="mt-16 overflow-hidden rounded-2xl border border-border-subtle bg-surface-raised"
        >
          <div className="grid grid-cols-12 gap-2 border-b border-border-subtle px-5 py-3 text-label text-muted-foreground uppercase">
            <span className="col-span-3">{t("teamColumn")}</span>
            <span className="col-span-5">{t("rolesEyebrow")}</span>
            <span className="col-span-2">{t("locationColumn")}</span>
            <span className="col-span-2 text-right">{t("typeColumn")}</span>
          </div>
          <div className="divide-y divide-border-subtle">
            {CAREERS_ROLES.map((role) => (
              <Link
                key={role.id}
                data-gsap-part
                href="/contact"
                aria-label={`${role.title} — ${t("applyCta")}`}
                className="group grid grid-cols-12 items-center gap-2 px-5 py-4 text-sm transition-colors hover:bg-muted/30"
              >
                <span className="col-span-3 text-label text-muted-foreground uppercase">
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
      </Section>

      <Section id="process">
        <SectionHeader eyebrow={t("processEyebrow")} title={t("processTitle")} />

        <div
          data-gsap="grid-stagger"
          className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6"
        >
          {CAREERS_PROCESS.map((step) => (
            <div
              key={step.id}
              data-gsap-item
              className="rounded-2xl border border-border-subtle bg-background p-6 sm:p-8"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-medium text-primary tabular-nums">{step.index}</span>
                <span className="text-label text-muted-foreground uppercase">{step.code}</span>
              </div>
              <h3 className="mt-8 text-xl font-medium tracking-tight text-foreground">
                {t(step.titleKey)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t(step.descriptionKey)}
              </p>
            </div>
          ))}
        </div>

        <div data-gsap="fade-up" className="mt-16">
          <Eyebrow>{t("benefitsEyebrow")}</Eyebrow>
        </div>
        <div
          data-gsap="grid-stagger"
          className="mt-6 grid grid-cols-1 border-t border-l border-border-subtle sm:grid-cols-2 lg:grid-cols-3"
        >
          {CAREERS_BENEFITS.map((benefit) => (
            <div
              key={benefit.id}
              data-gsap-item
              className="flex items-baseline gap-4 border-r border-b border-border-subtle p-6"
            >
              <span className="text-xs font-medium text-primary tabular-nums">{benefit.index}</span>
              <p className="text-base font-medium text-foreground">{t(benefit.key)}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="warm">
        <SectionHeader eyebrow={t("badge")} title={t("ctaTitle")} lead={t("ctaSubtitle")}>
          <CtaPair
            primary={{ href: "/contact", label: t("ctaPrimary") }}
            secondary={{ href: "/about", label: t("ctaSecondary") }}
          />
        </SectionHeader>
      </Section>
    </div>
  );
}
