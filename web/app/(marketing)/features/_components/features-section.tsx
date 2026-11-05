"use client";

import { useTranslations } from "next-intl";
import { CtaPair, PageHero, Section, SectionHeader } from "../../_components/swiss-layout";
import { FEATURE_MATRIX, INCLUDED_ITEMS } from "./features-utils";

export function FeaturesSection() {
  const t = useTranslations("Marketing.features");

  return (
    <div data-slot="features-section">
      <PageHero
        eyebrow={t("badge")}
        title={t("title")}
        lead={t("subtitle")}
        actions={
          <CtaPair
            primary={{ href: "/register", label: t("primaryCta") }}
            secondary={{ href: "/pricing", label: t("secondaryCta") }}
          />
        }
      />

      <Section id="matrix">
        <SectionHeader
          eyebrow={t("matrixEyebrow")}
          title={t("matrixTitle")}
          lead={t("matrixSubtitle")}
        />
        <div
          data-gsap="grid-stagger"
          className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
        >
          {FEATURE_MATRIX.map((feature) => (
            <div
              key={feature.id}
              data-gsap-item
              className="rounded-2xl border border-border-subtle bg-background p-6 transition-colors hover:bg-muted/30 sm:p-8"
            >
              <span className="text-label text-primary tabular-nums">{feature.index}</span>
              <h3 className="mt-8 text-xl font-medium tracking-tight text-foreground">
                {t(feature.titleKey)}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                {t(feature.descriptionKey)}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="included" tone="warm">
        <SectionHeader
          eyebrow={t("includedEyebrow")}
          title={t("includedTitle")}
          lead={t("includedSubtitle")}
        >
          <p className="text-sm font-medium text-primary">{t("includedNote")}</p>
        </SectionHeader>
        <div
          data-gsap="grid-stagger"
          className="mt-16 grid grid-cols-1 border-t border-l border-border-subtle bg-background sm:grid-cols-2 lg:grid-cols-4"
        >
          {INCLUDED_ITEMS.map((item) => (
            <div
              key={item.id}
              data-gsap-item
              className="border-r border-b border-border-subtle p-6 transition-colors hover:bg-muted/30 lg:p-8"
            >
              <span className="text-label text-primary tabular-nums">{item.index}</span>
              <p className="mt-8 text-xl font-medium tracking-tight text-foreground">{item.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.spec}</p>
            </div>
          ))}
        </div>
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
