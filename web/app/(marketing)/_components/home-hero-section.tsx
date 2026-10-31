"use client";

import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import { HomeErpShowcase } from "./home-erp-showcase";
import { PARTNER_LOGO_KEYS, PLATFORM_STAT_ITEMS, splitTitle } from "./marketing-utils";

export function HomeHeroSection() {
  const tHome = useTranslations("Marketing.home");
  const tShared = useTranslations("Marketing.shared");

  return (
    <section data-slot="home-hero-section" className="overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-12 lg:px-8 lg:pt-24 lg:pb-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-8">
            <p data-gsap="hero-meta" className="text-label text-muted-foreground uppercase">
              {tHome("badge")}
            </p>
            <h1
              data-gsap="hero-title"
              data-gsap-parallax
              data-gsap-speed="0.05"
              className="mt-5 text-display max-w-4xl font-medium text-foreground"
            >
              {splitTitle(tHome("title")).map((line, idx) => (
                <span key={line} className={cn("block", idx > 0 && "text-muted-foreground")}>
                  {line}
                </span>
              ))}
            </h1>
          </div>

          <div data-gsap="hero-meta" className="flex flex-col justify-end gap-8 lg:col-span-4">
            <p className="text-lg leading-relaxed text-muted-foreground">{tHome("subtitle")}</p>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Button size="lg" className="w-full justify-between rounded-full px-6" asChild>
                <Link href="/register">
                  <span>{tHome("primaryCta")}</span>
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full justify-between rounded-full px-6"
                asChild
              >
                <Link href="/contact">
                  <span>{tHome("secondaryCta")}</span>
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">{tHome("trialNote")}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-20 lg:px-8 lg:pb-28">
        <HomeErpShowcase />
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <p className="mb-6 text-sm text-muted-foreground">{tHome("trustedBy")}</p>
          <div data-gsap="grid-stagger" className="flex flex-wrap items-center gap-x-10 gap-y-4">
            {PARTNER_LOGO_KEYS.map((logoKey) => (
              <span
                key={logoKey}
                data-gsap-item
                className="text-base font-medium tracking-tight text-foreground/70"
              >
                {tShared(logoKey)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-border/60 bg-surface-warm">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div data-gsap="grid-stagger" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {PLATFORM_STAT_ITEMS.map((stat) => (
              <div key={stat.id} data-gsap-item className="space-y-2">
                <span className="text-sm text-muted-foreground">{tShared(stat.labelKey)}</span>
                <span className="block text-3xl font-medium tracking-tight text-foreground tabular-nums sm:text-4xl">
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
