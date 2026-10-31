"use client";

import { ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import { splitTitle } from "../../_components/marketing-utils";
import { PricingComparisonFaq } from "./pricing-comparison-faq";
import { type BillingCycle, PRICING_TIERS } from "./pricing-utils";

export function PricingSection() {
  const t = useTranslations("Marketing.pricing");
  const [cycle, setCycle] = useState<BillingCycle>("annual");

  return (
    <div data-slot="pricing-section">
      <section className="overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-12 lg:px-8 lg:pt-24 lg:pb-16">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
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

            <div data-gsap="hero-meta" className="flex flex-col justify-end gap-8 lg:col-span-5">
              <p className="text-lg leading-relaxed text-muted-foreground">{t("subtitle")}</p>

              <div className="flex flex-col gap-3">
                <div className="inline-flex rounded-full border border-border/60 bg-muted/40 p-1">
                  <button
                    type="button"
                    aria-pressed={cycle === "monthly"}
                    onClick={() => setCycle("monthly")}
                    className={cn(
                      "min-h-[40px] flex-1 rounded-full px-5 text-sm font-medium transition-colors",
                      cycle === "monthly"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t("monthly")}
                  </button>
                  <button
                    type="button"
                    aria-pressed={cycle === "annual"}
                    onClick={() => setCycle("annual")}
                    className={cn(
                      "inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-colors",
                      cycle === "annual"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span>{t("annual")}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      {t("save")}
                    </span>
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {cycle === "annual" ? t("annualNote") : t("monthlyNote")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div data-gsap="grid-stagger" className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {PRICING_TIERS.map((tier) => {
              const priceKey = cycle === "annual" ? tier.annualPriceKey : tier.monthlyPriceKey;
              return (
                <article
                  key={tier.id}
                  data-gsap-item
                  className={cn(
                    "flex flex-col justify-between gap-10 rounded-2xl border p-6 sm:p-8",
                    tier.popular
                      ? "border-primary/30 bg-primary/[0.03]"
                      : "border-border/60 bg-background",
                  )}
                >
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{t(tier.nameKey)}</span>
                      {tier.popular ? (
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {t("popular")}
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-medium tracking-tight tabular-nums sm:text-5xl">
                          {t(priceKey)}
                        </span>
                        <span className="text-sm text-muted-foreground">{t("perUserMonth")}</span>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {t(tier.descKey)}
                      </p>
                    </div>

                    <ul className="space-y-3 border-t border-border/40 pt-6">
                      {tier.featureKeys.map((fKey) => (
                        <li key={fKey} className="flex items-center gap-3 text-sm text-foreground">
                          <Check aria-hidden="true" className="size-4 shrink-0 text-primary" />
                          <span>{t(fKey)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    variant={tier.popular ? "default" : "outline"}
                    size="lg"
                    className="w-full justify-between rounded-full px-5"
                    asChild
                  >
                    <Link href={tier.href}>
                      <span>{t(tier.ctaKey)}</span>
                      <ArrowUpRight aria-hidden="true" className="size-4" />
                    </Link>
                  </Button>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <PricingComparisonFaq />
    </div>
  );
}
