"use client";

import { ArrowRight, ArrowUpRight, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import { HOME_FAQ_ITEMS, splitTitle } from "./marketing-utils";

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
      <section className="border-t border-border-subtle">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div data-gsap="section-header" className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="text-label text-muted-foreground uppercase">{t("pricingEyebrow")}</p>
              <h2 className="mt-4 text-headline text-foreground">
                {splitTitle(t("pricingTitle")).map((line, idx) => (
                  <span key={line} className={cn("block", idx > 0 && "text-muted-foreground")}>
                    {line}
                  </span>
                ))}
              </h2>
            </div>

            <div className="flex items-end lg:col-span-5 lg:col-start-8">
              <p className="text-lg leading-relaxed text-muted-foreground">
                {t("pricingSubtitle")}
              </p>
            </div>
          </div>

          <div data-gsap="grid-stagger" className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            {HOME_PLANS.map((plan) => (
              <div
                key={plan.id}
                data-gsap-item
                className={cn(
                  "flex flex-col justify-between gap-8 rounded-2xl border p-6 sm:p-8",
                  plan.popular
                    ? "border-primary/30 bg-primary/[0.03]"
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
                  className="w-full justify-between rounded-full px-5"
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
        </div>
      </section>

      <section className="border-t border-border-subtle">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div data-gsap="section-header" className="lg:col-span-5">
              <p className="text-label text-muted-foreground uppercase">{t("faqEyebrow")}</p>
              <h2 className="mt-4 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                {splitTitle(t("faqTitle")).map((line, idx) => (
                  <span key={line} className={cn("block", idx > 0 && "text-muted-foreground")}>
                    {line}
                  </span>
                ))}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                {t("faqSubtitle")}
              </p>
            </div>

            <div className="divide-y divide-border-subtle lg:col-span-7">
              {HOME_FAQ_ITEMS.map((item) => {
                const isOpen = openFaqId === item.id;
                return (
                  <div key={item.id} className="py-5 first:pt-0">
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
                        <Plus
                          aria-hidden="true"
                          className="size-4 shrink-0 text-muted-foreground"
                        />
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
        </div>
      </section>

      <section className="border-t border-border-subtle bg-surface-warm">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div
            data-gsap="section-header"
            className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12"
          >
            <div className="lg:col-span-8">
              <p className="text-label text-muted-foreground uppercase">{t("ctaNote")}</p>
              <h2 className="mt-4 text-headline text-foreground">
                {splitTitle(t("ctaTitle")).map((line, idx) => (
                  <span key={line} className={cn("block", idx > 0 && "text-muted-foreground")}>
                    {line}
                  </span>
                ))}
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                {t("ctaSubtitle")}
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:col-span-4">
              <Button size="lg" shape="pill" className="w-full justify-between px-5" asChild>
                <Link href="/register">
                  <span>{t("ctaPrimary")}</span>
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                shape="pill"
                className="w-full justify-between px-5"
                asChild
              >
                <Link href="/contact">
                  <span>{t("ctaSecondary")}</span>
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
