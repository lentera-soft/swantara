"use client";

import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CtaPair, Section, SectionHeader } from "../../_components/swiss-layout";
import { PRICING_COMPARISON_ROWS, PRICING_FAQ_ITEMS } from "./pricing-utils";

export function PricingComparisonFaq() {
  const t = useTranslations("Marketing.pricing");
  const [openFaqId, setOpenFaqId] = useState<string>("pfaq-1");

  return (
    <div data-slot="pricing-comparison-faq">
      <Section tone="warm">
        <SectionHeader index="01" eyebrow={t("featureColumn")} title={t("compareTitle")} />

        <div
          data-gsap="fade-up"
          className="mt-16 overflow-x-auto rounded-2xl border border-border-subtle bg-background"
        >
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-label text-muted-foreground uppercase">
                <th scope="col" className="px-6 py-4 font-medium">
                  {t("featureColumn")}
                </th>
                <th scope="col" className="px-6 py-4 font-medium">
                  {t("starterName")}
                </th>
                <th scope="col" className="px-6 py-4 font-medium text-primary">
                  {t("growthName")}
                </th>
                <th scope="col" className="px-6 py-4 font-medium">
                  {t("scaleName")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {PRICING_COMPARISON_ROWS.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-muted/30">
                  <th scope="row" className="px-6 py-4 font-medium text-foreground">
                    {t(row.labelKey)}
                  </th>
                  <td className="px-6 py-4 text-muted-foreground tabular-nums">
                    {t(row.starterKey)}
                  </td>
                  <td className="px-6 py-4 font-medium text-foreground tabular-nums">
                    {t(row.growthKey)}
                  </td>
                  <td className="px-6 py-4 text-foreground tabular-nums">{t(row.scaleKey)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section>
        <SectionHeader index="02" eyebrow="FAQ" title={t("faqTitle")} />

        <div
          data-gsap="fade-up"
          className="mt-16 divide-y divide-border-subtle border-y border-border-subtle"
        >
          {PRICING_FAQ_ITEMS.map((item) => {
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
      </Section>

      <Section tone="warm">
        <SectionHeader eyebrow={t("badge")} title={t("ctaTitle")} lead={t("ctaSubtitle")}>
          <CtaPair
            primary={{ href: "/register", label: t("ctaPrimary") }}
            secondary={{ href: "/contact", label: t("ctaSecondary") }}
          />
        </SectionHeader>
      </Section>
    </div>
  );
}
