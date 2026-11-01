"use client";

import { ArrowRight, ArrowUpRight, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import { splitTitle } from "../../_components/marketing-utils";
import { SwissIndexBadge } from "../../_components/swiss-grid-mark";
import { PRICING_COMPARISON_ROWS, PRICING_FAQ_ITEMS } from "./pricing-utils";

export function PricingComparisonFaq() {
  const t = useTranslations("Marketing.pricing");
  const [openFaqId, setOpenFaqId] = useState<string>("pfaq-1");

  return (
    <div data-slot="pricing-comparison-faq">
      <section className="border-t border-border-subtle bg-surface-warm">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div data-gsap="section-header" className="max-w-2xl">
            <SwissIndexBadge label={t("compareTitle")} />
            <h2 className="mt-4 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              {t("compareTitle")}
            </h2>
          </div>

          <div className="mt-12 overflow-x-auto rounded-2xl border border-border-subtle bg-background ">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border/40 text-xs text-muted-foreground">
                  <th scope="col" className="px-6 py-4 font-medium">
                    {t("featureColumn")}
                  </th>
                  <th scope="col" className="px-6 py-4 font-medium">
                    {t("starterName")}
                  </th>
                  <th scope="col" className="bg-primary/[0.03] px-6 py-4 font-medium text-primary">
                    {t("growthName")}
                  </th>
                  <th scope="col" className="px-6 py-4 font-medium">
                    {t("scaleName")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {PRICING_COMPARISON_ROWS.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-muted/25">
                    <th scope="row" className="px-6 py-4 font-medium text-foreground">
                      {t(row.labelKey)}
                    </th>
                    <td className="px-6 py-4 text-muted-foreground">{t(row.starterKey)}</td>
                    <td className="bg-primary/[0.02] px-6 py-4 font-medium text-foreground">
                      {t(row.growthKey)}
                    </td>
                    <td className="px-6 py-4 text-foreground">{t(row.scaleKey)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-t border-border-subtle">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div data-gsap="section-header" className="lg:col-span-5">
              <SwissIndexBadge label="FAQ" />
              <h2 className="mt-4 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                {t("faqTitle")}
              </h2>
            </div>

            <div className="divide-y divide-border-subtle lg:col-span-7">
              {PRICING_FAQ_ITEMS.map((item) => {
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
              <SwissIndexBadge label={t("badge")} />
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
