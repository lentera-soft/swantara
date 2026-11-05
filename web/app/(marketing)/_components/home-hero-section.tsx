"use client";

import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/button";
import { HomeErpShowcase } from "./home-erp-showcase";
import { PARTNER_LOGO_KEYS, PLATFORM_STAT_ITEMS } from "./marketing-utils";

/** Mask around one line of mega type; padding keeps descenders (g, comma) from clipping. */
const LINE_MASK = "block overflow-hidden pb-[0.18em] -mb-[0.18em]";

export function HomeHeroSection() {
  const tHome = useTranslations("Marketing.home");
  const tShared = useTranslations("Marketing.shared");
  const words = tHome.raw("heroTitleWords") as string[];
  const lead = tHome("heroTitleLead");
  const prefix = tHome("heroTitlePrefix");

  return (
    <section data-slot="home-hero-section" className="overflow-hidden">
      {/*
        Full-bleed intro: edge gutters only, no centred container. The last word loops
        (data-gsap="word-cycle" in useSwissAnimations). Screen readers get one stable sentence.
      */}
      <div
        data-gsap="word-cycle"
        className="flex min-h-[calc(100svh-6rem)] flex-col px-4 pb-6 sm:min-h-[calc(100svh-7rem)] sm:px-6 lg:px-8 lg:pb-8"
      >
        <div className="border-t border-border-subtle pt-4">
          <p data-gsap="hero-meta" className="text-label text-muted-foreground uppercase">
            {tHome("heroEyebrow")}
          </p>
        </div>

        {/*
          Two lines, set flush left at the top of the intro, under the eyebrow rule. The rotating
          word sits inline after the prefix; its slot is as wide as the longest word, so the
          line never reflows when the word changes.
        */}
        <h1 className="flex flex-1 flex-col justify-start pt-8 pb-10 text-mega text-foreground lg:pt-12">
          <span className="sr-only">{`${lead} ${prefix} ${words[0] ?? ""}`}</span>
          <span aria-hidden="true" className={LINE_MASK}>
            <span data-word-line className="block">
              {lead}
            </span>
          </span>
          <span aria-hidden="true" className={`${LINE_MASK} whitespace-nowrap`}>
            <span data-word-line className="inline-block text-muted-foreground">
              {prefix}
            </span>{" "}
            <span className="inline-grid text-primary">
              {words.map((word, index) => (
                <span
                  key={word}
                  data-word
                  className={
                    index === 0 ? "col-start-1 row-start-1" : "invisible col-start-1 row-start-1"
                  }
                >
                  {word}
                </span>
              ))}
            </span>
          </span>
        </h1>

        <div className="grid grid-cols-1 gap-6 border-t border-border-subtle pt-5 lg:grid-cols-12 lg:items-end lg:gap-8">
          <p
            data-gsap="hero-meta"
            className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg lg:col-span-5"
          >
            {tHome("subtitle")}
          </p>
          <p
            data-gsap="hero-meta"
            className="text-sm text-muted-foreground lg:col-span-3 lg:col-start-6"
          >
            {tHome("trialNote")}
          </p>
          <div
            data-gsap="hero-meta"
            className="flex flex-col gap-3 sm:flex-row lg:col-span-4 lg:col-start-9"
          >
            <Button
              size="lg"
              shape="pill"
              className="w-full justify-between px-6 sm:w-auto sm:flex-1"
              asChild
            >
              <Link href="/register">
                <span>{tHome("primaryCta")}</span>
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              shape="pill"
              className="w-full justify-between px-6 sm:w-auto sm:flex-1"
              asChild
            >
              <Link href="/contact">
                <span>{tHome("secondaryCta")}</span>
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 pt-16 pb-20 lg:px-8 lg:pt-24 lg:pb-28">
        <HomeErpShowcase />
      </div>

      <div className="border-t border-border-subtle">
        <div className="px-4 sm:px-6 py-10 lg:px-8">
          <p className="mb-6 text-sm text-muted-foreground">{tHome("trustedBy")}</p>
          <div data-gsap="fade-up">
            <ul className="flex w-full flex-wrap items-center gap-x-10 gap-y-4">
              {PARTNER_LOGO_KEYS.map((logoKey) => (
                <li
                  key={logoKey}
                  className="text-xl font-medium tracking-tight whitespace-nowrap text-foreground/70"
                >
                  {tShared(logoKey)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border-subtle bg-surface-warm">
        <div className="px-4 sm:px-6 py-12 lg:px-8">
          <div data-gsap="grid-stagger" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {PLATFORM_STAT_ITEMS.map((stat) => (
              <div key={stat.id} data-gsap-item className="space-y-2">
                <span className="text-sm text-muted-foreground">{tShared(stat.labelKey)}</span>
                <span
                  data-gsap="counter"
                  className="block text-3xl font-medium tracking-tight text-foreground tabular-nums sm:text-4xl"
                >
                  {tShared(stat.valueKey)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
