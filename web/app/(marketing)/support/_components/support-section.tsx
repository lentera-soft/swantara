"use client";

import { ArrowUpRight, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CtaPair, PageHero, Section, SectionHeader } from "../../_components/swiss-layout";
import { SUPPORT_CHANNELS, SUPPORT_FAQ_ITEMS, SUPPORT_RESPONSE_ROWS } from "./support-utils";

export function SupportSection() {
  const t = useTranslations("Marketing.support");
  const [openFaqId, setOpenFaqId] = useState<string>("sfaq-1");

  return (
    <div data-slot="support-section">
      <PageHero
        eyebrow={t("badge")}
        title={t("title")}
        lead={t("subtitle")}
        actions={
          <CtaPair
            primary={{ href: "/contact", label: t("primaryCta") }}
            secondary={{ href: "/guides", label: t("secondaryCta") }}
          />
        }
      />

      <Section id="channels">
        <SectionHeader index="01" eyebrow={t("channelsEyebrow")} title={t("channelsTitle")} />

        <div
          data-gsap="grid-stagger"
          className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
        >
          {SUPPORT_CHANNELS.map((channel) => (
            <div
              key={channel.id}
              data-gsap-item
              className="flex min-h-64 flex-col justify-between rounded-2xl border border-border-subtle bg-background p-6 transition-colors hover:bg-muted/30 sm:p-8"
            >
              <div>
                <span className="text-label text-muted-foreground uppercase">{channel.code}</span>
                <h3 className="mt-10 text-xl font-medium tracking-tight text-foreground">
                  {t(channel.titleKey)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(channel.descriptionKey)}
                </p>
              </div>

              <div className="mt-6 border-t border-border-subtle pt-4">
                {channel.kind === "internal" ? (
                  <Link
                    href={channel.href}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
                  >
                    <span>{t(channel.actionKey)}</span>
                    <ArrowUpRight aria-hidden="true" className="size-3.5" />
                  </Link>
                ) : channel.kind === "email" ? (
                  <a
                    href={channel.href}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
                  >
                    <span>{t(channel.actionKey)}</span>
                    <ArrowUpRight aria-hidden="true" className="size-3.5" />
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
                    <span>{t(channel.actionKey)}</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="response-times" tone="warm">
        <SectionHeader index="02" eyebrow={t("responseEyebrow")} title={t("responseTitle")} />

        <div
          data-gsap="fade-up"
          className="mt-16 overflow-x-auto rounded-2xl border border-border-subtle bg-background"
        >
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-label text-muted-foreground uppercase">
                <th scope="col" className="px-6 py-4 font-medium">
                  {t("tierColumn")}
                </th>
                <th scope="col" className="px-6 py-4 font-medium">
                  {t("channelColumn")}
                </th>
                <th scope="col" className="px-6 py-4 font-medium">
                  {t("timeColumn")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {SUPPORT_RESPONSE_ROWS.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-muted/30">
                  <th
                    scope="row"
                    className={cn(
                      "px-6 py-4 font-medium text-foreground",
                      row.popular && "text-primary",
                    )}
                  >
                    {row.plan}
                  </th>
                  <td className="px-6 py-4 text-muted-foreground">{t(row.channelKey)}</td>
                  <td className="px-6 py-4 text-foreground tabular-nums">{t(row.timeKey)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="faq">
        <SectionHeader index="03" eyebrow={t("faqEyebrow")} title={t("faqTitle")} />

        <div
          data-gsap="fade-up"
          className="mt-16 divide-y divide-border-subtle border-y border-border-subtle"
        >
          {SUPPORT_FAQ_ITEMS.map((item) => {
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
            primary={{ href: "/contact", label: t("ctaPrimary") }}
            secondary={{ href: "/guides", label: t("ctaSecondary") }}
          />
        </SectionHeader>
      </Section>
    </div>
  );
}
