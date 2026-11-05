"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { CtaPair, Eyebrow, PageHero, Section, SectionHeader } from "../../_components/swiss-layout";
import { INTEGRATION_PROTOCOLS, PRODUCT_MODULES, SECURITY_SPECS } from "./product-utils";

export function ProductSection() {
  const t = useTranslations("Marketing.product");

  return (
    <div data-slot="product-section">
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

      {/* Modules: same columns on every row (index · copy · live record panel) */}
      <Section id="modules">
        <div className="space-y-16 lg:space-y-24">
          {PRODUCT_MODULES.map((mod, idx) => (
            <article
              key={mod.id}
              className="grid grid-cols-1 gap-8 border-t border-border-subtle pt-8 lg:grid-cols-12"
            >
              <div data-gsap="fade-up" className="lg:col-span-2">
                <Eyebrow index={String(idx + 1).padStart(2, "0")}>{t(mod.eyebrowKey)}</Eyebrow>
              </div>

              <div data-gsap="fade-up" className="space-y-6 lg:col-span-4">
                <h2 className="text-3xl font-medium tracking-tight text-balance text-foreground sm:text-4xl">
                  {t(mod.titleKey)}
                </h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {t(mod.descriptionKey)}
                </p>
                <ul className="divide-y divide-border-subtle border-y border-border-subtle">
                  {mod.pointKeys.map((pointKey) => (
                    <li key={pointKey} className="flex items-start gap-3 py-3 text-base">
                      <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
                      <span className="text-foreground/85">{t(pointKey)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-6 lg:col-start-7">
                <div
                  data-gsap="frame"
                  className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-raised"
                >
                  <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
                    <span className="text-label text-muted-foreground uppercase">
                      {mod.flowCode}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                      <span aria-hidden="true" className="size-1.5 rounded-full bg-success" />
                      Live
                    </span>
                  </div>
                  <div className="divide-y divide-border-subtle">
                    {mod.records.map((rec) => (
                      <div
                        key={rec.id}
                        data-gsap-part
                        className="grid grid-cols-12 items-center gap-2 px-5 py-4 text-sm"
                      >
                        <span className="col-span-3 text-xs text-muted-foreground tabular-nums">
                          {rec.ref}
                        </span>
                        <span className="col-span-5 truncate font-medium text-foreground">
                          {rec.entity}
                        </span>
                        <span className="col-span-2 text-right text-xs text-muted-foreground tabular-nums">
                          {rec.metric}
                        </span>
                        <span className="col-span-2 text-right text-xs font-medium text-primary">
                          {rec.state}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section id="security" tone="warm">
        <SectionHeader eyebrow={t("securityEyebrow")} title={t("securityTitle")} />
        <div
          data-gsap="grid-stagger"
          className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
        >
          {SECURITY_SPECS.map((spec) => (
            <div
              key={spec.id}
              data-gsap-item
              className="flex min-h-40 flex-col justify-between rounded-2xl border border-border-subtle bg-background p-6"
            >
              <span className="text-label text-muted-foreground uppercase">{spec.code}</span>
              <p className="mt-8 text-lg font-medium tracking-tight text-foreground">
                {t(spec.key)}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader
          eyebrow="Integrations"
          title={t("integrationsTitle")}
          lead={t("integrationsSubtitle")}
        >
          <p className="text-sm font-medium text-primary">{t("integrationsNote")}</p>
        </SectionHeader>
        <div
          data-gsap="grid-stagger"
          className="mt-16 grid grid-cols-1 border-t border-l border-border-subtle sm:grid-cols-2 lg:grid-cols-3"
        >
          {INTEGRATION_PROTOCOLS.map((proto) => (
            <div
              key={proto.id}
              data-gsap-item
              className="border-r border-b border-border-subtle p-6 transition-colors hover:bg-muted/30 lg:p-8"
            >
              <span className="text-label text-primary tabular-nums">{proto.index}</span>
              <p className="mt-8 text-xl font-medium tracking-tight text-foreground">
                {proto.name}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{proto.spec}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
