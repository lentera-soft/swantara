"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { CtaPair, PageHero, Section, SectionHeader } from "../../_components/swiss-layout";
import { CHANGELOG_CADENCE, CHANGELOG_RELEASES } from "./changelog-utils";

export function ChangelogSection() {
  const t = useTranslations("Marketing.changelog");

  return (
    <div data-slot="changelog-section">
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

      {/* Releases: ruled rows, version/date in cols 1–3, notes in cols 4–9 */}
      <Section id="releases">
        <SectionHeader eyebrow={t("releasesEyebrow")} title={t("releasesTitle")} />
        <div className="mt-16 space-y-12 lg:space-y-16">
          {CHANGELOG_RELEASES.map((release) => (
            <article
              key={release.id}
              data-gsap="fade-up"
              className="grid grid-cols-1 gap-4 border-t border-border-subtle pt-8 lg:grid-cols-12 lg:gap-8"
            >
              <div className="space-y-2 lg:col-span-3">
                <p className="text-label text-primary tabular-nums">{t(release.versionKey)}</p>
                <p className="text-sm text-muted-foreground tabular-nums">{t(release.dateKey)}</p>
                <p className="text-label text-muted-foreground uppercase">{t(release.tagKey)}</p>
              </div>
              <div className="lg:col-span-6 lg:col-start-4">
                <h3 className="text-2xl font-medium tracking-tight text-balance text-foreground sm:text-3xl">
                  {t(release.titleKey)}
                </h3>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                  {t(release.descriptionKey)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section id="cadence" tone="warm">
        <SectionHeader eyebrow={t("cadenceEyebrow")} title={t("cadenceTitle")} />
        <ul
          data-gsap="grid-stagger"
          className="mt-16 divide-y divide-border-subtle border-y border-border-subtle"
        >
          {CHANGELOG_CADENCE.map((item) => (
            <li key={item.id} data-gsap-item className="flex items-start gap-3 py-5 text-lg">
              <Check aria-hidden="true" className="mt-1.5 size-4 shrink-0 text-primary" />
              <span className="max-w-2xl text-foreground/85">{t(item.key)}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <SectionHeader eyebrow={t("badge")} title={t("ctaTitle")} lead={t("ctaSubtitle")}>
          <CtaPair
            primary={{ href: "/register", label: t("ctaPrimary") }}
            secondary={{ href: "/product", label: t("ctaSecondary") }}
          />
        </SectionHeader>
      </Section>
    </div>
  );
}
