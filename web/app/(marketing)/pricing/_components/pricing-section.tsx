"use client";

import { ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import { PageHero, Section } from "../../_components/swiss-layout";
import { PricingComparisonFaq } from "./pricing-comparison-faq";
import { type BillingCycle, PRICING_TIERS } from "./pricing-utils";

export function PricingSection() {
  const t = useTranslations("Marketing.pricing");
  const [cycle, setCycle] = useState<BillingCycle>("annual");

  return (
    <div data-slot="pricing-section">
      <PageHero
        eyebrow={t("badge")}
        title={t("title")}
        lead={t("subtitle")}
        actions={
          <div className="flex flex-col gap-3">
            <div className="flex rounded-full border border-border-subtle bg-muted/40 p-1">
              <button
                type="button"
                aria-pressed={cycle === "monthly"}
                onClick={() => setCycle("monthly")}
                className={cn(
                  "min-h-[40px] flex-1 rounded-full px-5 text-sm font-medium transition-colors",
                  cycle === "monthly"
                    ? "bg-background text-foreground"
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
                    ? "bg-background text-foreground"
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
        }
      />

      <Section>
        <div data-gsap="grid-stagger" className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
          {PRICING_TIERS.map((tier, idx) => {
            const priceKey = cycle === "annual" ? tier.annualPriceKey : tier.monthlyPriceKey;
            return (
              <article
                key={tier.id}
                data-gsap-item
                className={cn(
                  "flex flex-col justify-between gap-10 rounded-2xl border bg-background p-6 sm:p-8",
                  tier.popular ? "border-primary" : "border-border-subtle",
                )}
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-baseline gap-3">
                      <span className="text-label text-primary tabular-nums">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm font-medium text-foreground">{t(tier.nameKey)}</span>
                    </span>
                    {tier.popular ? (
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-label text-primary uppercase">
                        {t("popular")}
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-medium tracking-tight text-foreground tabular-nums sm:text-5xl">
                        {t(priceKey)}
                      </span>
                      <span className="text-sm text-muted-foreground">{t("perUserMonth")}</span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {t(tier.descKey)}
                    </p>
                  </div>

                  <ul className="divide-y divide-border-subtle border-y border-border-subtle">
                    {tier.featureKeys.map((fKey) => (
                      <li
                        key={fKey}
                        className="flex items-center gap-3 py-3 text-sm text-foreground"
                      >
                        <Check aria-hidden="true" className="size-4 shrink-0 text-primary" />
                        <span>{t(fKey)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  variant={tier.popular ? "default" : "outline"}
                  size="lg"
                  shape="pill"
                  className="w-full justify-between px-5"
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
      </Section>

      <PricingComparisonFaq />
    </div>
  );
}
