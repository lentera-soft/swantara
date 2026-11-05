"use client";

import { ArrowRight, ArrowUpRight, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import { splitTitle } from "../../_components/marketing-utils";
import { SwissIndexBadge } from "../../_components/swiss-grid-mark";
import { SUPPORT_CHANNELS, SUPPORT_FAQ_ITEMS, SUPPORT_RESPONSE_ROWS } from "./support-utils";

export function SupportSection() {
  const t = useTranslations("Marketing.support");
  const [openFaqId, setOpenFaqId] = useState<string>("sfaq-1");

  return (
    <div data-slot="support-section">
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
                <Button size="lg" shape="pill" className="w-full justify-between px-6" asChild>
                  <Link href="/contact">
                    <span>{t("primaryCta")}</span>
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  shape="pill"
                  className="w-full justify-between px-6"
                  asChild
                >
                  <Link href="/guides">
                    <span>{t("secondaryCta")}</span>
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="channels" className="border-t border-border-subtle">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div data-gsap="section-header" className="max-w-2xl">
            <SwissIndexBadge label={t("channelsEyebrow")} />
            <h2 className="mt-4 text-headline text-foreground">
              {splitTitle(t("channelsTitle")).map((line, idx) => (
                <span key={line} className={cn("block", idx > 0 && "text-muted-foreground")}>
                  {line}
                </span>
              ))}
            </h2>
          </div>

          <div
            data-gsap="grid-stagger"
            className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {SUPPORT_CHANNELS.map((channel) => (
              <div
                key={channel.id}
                data-gsap-item
                className="flex flex-col justify-between rounded-2xl border border-border-subtle bg-background p-6 transition-colors hover:bg-muted/30"
              >
                <div>
                  <span className="font-mono text-xs text-muted-foreground">{channel.code}</span>
                  <h3 className="mt-4 text-base font-medium text-foreground">
                    {t(channel.titleKey)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(channel.descriptionKey)}
                  </p>
                </div>

                <div className="mt-6">
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
        </div>
      </section>

      <section id="response-times" className="border-t border-border-subtle bg-surface-warm">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div data-gsap="section-header" className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SwissIndexBadge label={t("responseEyebrow")} />
              <h2 className="mt-4 text-headline text-foreground">
                {splitTitle(t("responseTitle")).map((line, idx) => (
                  <span key={line} className={cn("block", idx > 0 && "text-muted-foreground")}>
                    {line}
                  </span>
                ))}
              </h2>
            </div>

            <div className="lg:col-span-6 lg:col-start-7">
              <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-background">
                <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/40 text-xs text-muted-foreground">
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
                  <tbody className="divide-y divide-border/40">
                    {SUPPORT_RESPONSE_ROWS.map((row) => (
                      <tr key={row.id} className="transition-colors hover:bg-muted/25">
                        <th
                          scope="row"
                          className={cn(
                            "px-6 py-4 font-medium text-foreground",
                            row.popular && "bg-primary/[0.02] text-primary",
                          )}
                        >
                          {row.plan}
                        </th>
                        <td className="px-6 py-4 text-muted-foreground">{t(row.channelKey)}</td>
                        <td className="px-6 py-4 text-foreground">{t(row.timeKey)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="border-t border-border-subtle">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div data-gsap="section-header" className="lg:col-span-5">
              <SwissIndexBadge label={t("faqEyebrow")} />
              <h2 className="mt-4 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                {t("faqTitle")}
              </h2>
            </div>

            <div className="divide-y divide-border-subtle lg:col-span-7">
              {SUPPORT_FAQ_ITEMS.map((item) => {
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
                <Link href="/contact">
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
                <Link href="/guides">
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
