"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/button";
import { CtaPair, PageHero, Section, SectionHeader } from "../../_components/swiss-layout";
import { SECURITY_COMMITMENTS, SECURITY_CONTACT_EMAIL, SECURITY_PILLARS } from "./security-utils";

export function SecuritySection() {
  const t = useTranslations("Marketing.security");

  return (
    <div data-slot="security-section">
      <PageHero
        eyebrow={t("badge")}
        title={t("title")}
        lead={t("subtitle")}
        actions={
          <CtaPair
            primary={{ href: "/register", label: t("primaryCta") }}
            secondary={{ href: "/contact", label: t("secondaryCta") }}
          />
        }
      />

      <Section id="pillars" tone="warm">
        <SectionHeader index="01" eyebrow={t("pillarEyebrow")} title={t("pillarTitle")} />

        <div
          data-gsap="grid-stagger"
          className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
        >
          {SECURITY_PILLARS.map((pillar) => (
            <div
              key={pillar.id}
              data-gsap-item
              className="flex min-h-48 flex-col justify-between rounded-2xl border border-border-subtle bg-background p-6 sm:p-8"
            >
              <span className="text-label text-muted-foreground uppercase">{pillar.code}</span>
              <div className="mt-10">
                <h3 className="text-xl font-medium tracking-tight text-foreground">
                  {t(pillar.titleKey)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(pillar.descriptionKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="commitments">
        <SectionHeader index="02" eyebrow={t("commitEyebrow")} title={t("commitTitle")} />

        <ul
          data-gsap="grid-stagger"
          className="mt-16 grid grid-cols-1 gap-x-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {SECURITY_COMMITMENTS.map((commitment, idx) => (
            <li
              key={commitment.id}
              data-gsap-item
              className="flex flex-col gap-6 border-t border-border-subtle py-6"
            >
              <span className="text-label text-primary tabular-nums">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span className="max-w-md text-lg leading-relaxed text-foreground">
                {t(commitment.key)}
              </span>
            </li>
          ))}
        </ul>

        <div
          data-gsap="fade-up"
          className="mt-16 grid grid-cols-1 gap-6 rounded-2xl border border-border-subtle bg-background p-6 sm:p-8 lg:grid-cols-12 lg:items-end lg:gap-8"
        >
          <div className="space-y-2 lg:col-span-7">
            <h3 className="text-xl font-medium tracking-tight text-foreground">
              {t("trustTitle")}
            </h3>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t("trustDescription")}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:col-span-4 lg:col-start-9">
            <Button variant="outline" size="lg" shape="pill" className="px-5" asChild>
              <a href={`mailto:${SECURITY_CONTACT_EMAIL}`}>
                <span>{t("trustCta")}</span>
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </a>
            </Button>
            <p className="text-sm text-muted-foreground">
              {t("dpaNote")}{" "}
              <Link
                href="/dpa"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {t("dpaLink")}
              </Link>
            </p>
          </div>
        </div>
      </Section>

      <Section tone="warm">
        <SectionHeader eyebrow={t("badge")} title={t("ctaTitle")} lead={t("ctaSubtitle")}>
          <CtaPair
            primary={{ href: "/register", label: t("ctaPrimary") }}
            secondary={{ href: "/contact", label: t("ctaSecondary") }}
          />
        </SectionHeader>
      </Section>
    </div>
  );
}
