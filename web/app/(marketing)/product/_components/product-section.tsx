"use client";

import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import { splitTitle } from "../../_components/marketing-utils";
import { SwissIndexBadge } from "../../_components/swiss-grid-mark";
import { INTEGRATION_PROTOCOLS, PRODUCT_MODULES, SECURITY_SPECS } from "./product-utils";

export function ProductSection() {
  const t = useTranslations("Marketing.product");

  return (
    <div data-slot="product-section">
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
                <Button size="lg" className="w-full justify-between rounded-full px-6" asChild>
                  <Link href="/register">
                    <span>{t("primaryCta")}</span>
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full justify-between rounded-full px-6"
                  asChild
                >
                  <Link href="/pricing">
                    <span>{t("secondaryCta")}</span>
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="modules" className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="space-y-24 lg:space-y-32">
            {PRODUCT_MODULES.map((mod, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <article
                  key={mod.id}
                  data-gsap="section-header"
                  className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16"
                >
                  <div
                    className={cn(
                      "space-y-6 lg:col-span-5",
                      isEven ? "lg:col-start-1" : "lg:col-start-8",
                    )}
                  >
                    <SwissIndexBadge label={t(mod.eyebrowKey)} />
                    <h2 className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                      {t(mod.titleKey)}
                    </h2>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      {t(mod.descriptionKey)}
                    </p>

                    <ul className="space-y-3 pt-2">
                      {mod.pointKeys.map((pointKey) => (
                        <li key={pointKey} className="flex items-start gap-3 text-base">
                          <span className="mt-1 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Check aria-hidden="true" className="size-3 text-primary" />
                          </span>
                          <span className="text-foreground/85">{t(pointKey)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div
                    className={cn("lg:col-span-6", isEven ? "lg:col-start-7" : "lg:col-start-1")}
                  >
                    <div
                      data-gsap="scale-reveal"
                      className="overflow-hidden rounded-2xl border border-border/60 bg-surface-raised shadow-sm"
                    >
                      <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
                        <span className="text-xs font-medium text-muted-foreground">
                          {mod.flowCode}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                          <Check aria-hidden="true" className="size-3.5" />
                          Live
                        </span>
                      </div>
                      <div className="divide-y divide-border/30">
                        {mod.records.map((rec) => (
                          <div
                            key={rec.id}
                            className="grid grid-cols-12 items-center gap-2 px-5 py-3.5 text-sm"
                          >
                            <span className="col-span-3 text-xs text-muted-foreground tabular-nums">
                              {rec.ref}
                            </span>
                            <span className="col-span-5 truncate font-medium text-foreground">
                              {rec.entity}
                            </span>
                            <span className="col-span-2 text-right text-xs tabular-nums text-muted-foreground">
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
              );
            })}
          </div>
        </div>
      </section>

      <section id="security" className="border-t border-border/60 bg-surface-warm">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div data-gsap="section-header" className="max-w-2xl">
            <SwissIndexBadge label={t("securityEyebrow")} />
            <h2 className="mt-4 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              {t("securityTitle")}
            </h2>
          </div>

          <div
            data-gsap="grid-stagger"
            className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {SECURITY_SPECS.map((spec) => (
              <div
                key={spec.id}
                data-gsap-item
                className="rounded-2xl border border-border/60 bg-background p-6"
              >
                <span className="text-xs font-medium text-muted-foreground">{spec.code}</span>
                <p className="mt-4 text-base font-medium text-foreground">{t(spec.key)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div data-gsap="section-header" className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SwissIndexBadge label="Integrations" />
              <h2 className="mt-4 text-headline text-foreground">
                {splitTitle(t("integrationsTitle")).map((line, idx) => (
                  <span key={line} className={cn("block", idx > 0 && "text-muted-foreground")}>
                    {line}
                  </span>
                ))}
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                {t("integrationsSubtitle")}
              </p>
              <p className="mt-4 text-sm font-medium text-primary">{t("integrationsNote")}</p>
            </div>

            <div
              data-gsap="grid-stagger"
              className="grid grid-cols-1 gap-px rounded-2xl border border-border/60 bg-border/40 sm:grid-cols-2 lg:col-span-6 lg:col-start-7"
            >
              {INTEGRATION_PROTOCOLS.map((proto) => (
                <div
                  key={proto.id}
                  data-gsap-item
                  className="bg-background p-6 transition-colors hover:bg-muted/30"
                >
                  <span className="text-xs text-muted-foreground tabular-nums">{proto.index}</span>
                  <div className="mt-4">
                    <p className="text-base font-medium text-foreground">{proto.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{proto.spec}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
