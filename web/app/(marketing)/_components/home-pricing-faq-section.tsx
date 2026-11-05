"use client";

import { ArrowUpRight, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import { HOME_FAQ_ITEMS } from "./marketing-utils";
import { CtaPair, Section, SectionHeader } from "./swiss-layout";

const HOME_PLANS = [
  {
    id: "starter",
    nameKey: "planStarter",
    priceKey: "planStarterPrice",
    descKey: "planStarterDesc",
    ctaKey: "planStarterCta",
    href: "/register",
    popular: false,
  },
  {
    id: "growth",
    nameKey: "planGrowth",
    priceKey: "planGrowthPrice",
    descKey: "planGrowthDesc",
    ctaKey: "planGrowthCta",
    href: "/register",
    popular: true,
  },
  {
    id: "scale",
    nameKey: "planScale",
    priceKey: "planScalePrice",
    descKey: "planScaleDesc",
    ctaKey: "planScaleCta",
    href: "/contact",
    popular: false,
  },
] as const;

export function HomePricingFaqSection() {
  const t = useTranslations("Marketing.home");
  const [openFaqId, setOpenFaqId] = useState<string>("faq-1");

  return (
    <div data-slot="home-pricing-faq-section">
      <Section>
        <SectionHeader
          eyebrow={t("pricingEyebrow")}
          title={t("pricingTitle")}
          lead={t("pricingSubtitle")}
        />

        <div data-gsap="grid-stagger" className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {HOME_PLANS.map((plan) => (
            <div
              key={plan.id}
              data-gsap-item
              className={cn(
                "flex flex-col justify-between gap-8 rounded-2xl border p-6 sm:p-8",
                plan.popular
                  ? "border-primary bg-background"
                  : "border-border-subtle bg-background",
              )}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{t(plan.nameKey)}</span>
                  {plan.popular ? (
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {t("planPopular")}
                    </span>
                  ) : null}
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-medium tracking-tight tabular-nums sm:text-5xl">
                      {t(plan.priceKey)}
                    </span>
                    <span className="text-sm text-muted-foreground">{t("perUserMonth")}</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {t(plan.descKey)}
                  </p>
                </div>
              </div>

              <Button
                variant={plan.popular ? "default" : "outline"}
                size="lg"
                shape="pill"
                className="w-full justify-between px-5"
                asChild
              >
                <Link href={plan.href}>
                  <span>{t(plan.ctaKey)}</span>
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader eyebrow={t("faqEyebrow")} title={t("faqTitle")} lead={t("faqSubtitle")} />
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-12">
          <div className="divide-y divide-border-subtle border-y border-border-subtle lg:col-span-8 lg:col-start-5">
            {HOME_FAQ_ITEMS.map((item) => {
              const isOpen = openFaqId === item.id;
              return (
                <div key={item.id} className="py-5">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqId(isOpen ? "" : item.id)}
                    className="flex w-full items-center justify-between gap-4 text-left"
                  >
                    <span className="text-base font-medium tracking-tight text-foreground sm:text-lg">
                      {t(item.questionKey)}
                    </span>
                    {isOpen ? (
                      <Minus aria-hidden="true" className="size-4 shrink-0 text-primary" />
                    ) : (
                      <Plus aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                  {isOpen ? (
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {t(item.answerKey)}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      <Section tone="warm">
        <SectionHeader eyebrow={t("ctaNote")} title={t("ctaTitle")} lead={t("ctaSubtitle")}>
          <CtaPair
            primary={{ href: "/register", label: t("ctaPrimary") }}
            secondary={{ href: "/contact", label: t("ctaSecondary") }}
          />
        </SectionHeader>
      </Section>
    </div>
  );
}
