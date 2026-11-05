"use client";

import { useTranslations } from "next-intl";
import { CtaPair, PageHero, Section, SectionHeader } from "../../_components/swiss-layout";
import { GUIDE_COLLECTIONS, GUIDE_TOPICS } from "./guides-utils";

export function GuidesSection() {
  const t = useTranslations("Marketing.guides");

  return (
    <div data-slot="guides-section">
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

      <Section id="collections">
        <SectionHeader eyebrow={t("collectionsEyebrow")} title={t("collectionsTitle")} />
        <div
          data-gsap="grid-stagger"
          className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
        >
          {GUIDE_COLLECTIONS.map((guide) => (
            <div
              key={guide.id}
              data-gsap-item
              className="rounded-2xl border border-border-subtle bg-background p-6 transition-colors hover:bg-muted/30 sm:p-8"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-label text-muted-foreground uppercase">{guide.code}</span>
                <span className="text-label text-muted-foreground uppercase tabular-nums">
                  {t(guide.readTimeKey)}
                </span>
              </div>
              <h3 className="mt-8 text-xl font-medium tracking-tight text-foreground">
                {t(guide.titleKey)}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                {t(guide.descriptionKey)}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="topics" tone="warm">
        <SectionHeader
          eyebrow={t("topicsEyebrow")}
          title={t("topicsTitle")}
          lead={t("topicsSubtitle")}
        >
          <p className="text-sm font-medium text-primary">{t("guidesNote")}</p>
        </SectionHeader>
        <div
          data-gsap="grid-stagger"
          className="mt-16 grid grid-cols-1 border-t border-l border-border-subtle bg-background sm:grid-cols-2 lg:grid-cols-4"
        >
          {GUIDE_TOPICS.map((topic) => (
            <div
              key={topic.id}
              data-gsap-item
              className="border-r border-b border-border-subtle p-6 transition-colors hover:bg-muted/30 lg:p-8"
            >
              <span className="text-label text-primary tabular-nums">{topic.index}</span>
              <p className="mt-8 text-xl font-medium tracking-tight text-foreground">
                {topic.name}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{topic.spec}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader eyebrow={t("badge")} title={t("ctaTitle")} lead={t("ctaSubtitle")}>
          <CtaPair
            primary={{ href: "/register", label: t("ctaPrimary") }}
            secondary={{ href: "/support", label: t("ctaSecondary") }}
          />
        </SectionHeader>
      </Section>
    </div>
  );
}
