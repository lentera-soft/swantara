"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { HOME_FEATURE_CONFIGS } from "./marketing-utils";
import { SectionHeader } from "./swiss-layout";

export function HomeFeaturesSection() {
  const t = useTranslations("Marketing.home");
  const tActions = useTranslations("Marketing.actions");

  return (
    <section data-slot="home-features-section" className="border-t border-border-subtle">
      <div className="px-4 pt-20 sm:px-6 lg:px-8 lg:pt-28">
        <SectionHeader
          eyebrow={t("featuresEyebrow")}
          title={t("featuresTitle")}
          lead={t("featuresSubtitle")}
        >
          <Link
            href="/product"
            className="group inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            <span>{tActions("explore")}</span>
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </SectionHeader>
      </div>

      <div className="px-4 sm:px-6 pt-16 pb-20 lg:px-8 lg:pb-28">
        <ul
          data-gsap="grid-stagger"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
        >
          {HOME_FEATURE_CONFIGS.map((feature) => (
            <li
              key={feature.id}
              data-gsap-item
              className="group flex flex-col rounded-2xl border border-border-subtle bg-background p-6 transition-colors hover:bg-muted/30 sm:p-8"
            >
              <div className="flex items-center justify-between">
                <span className="text-label text-muted-foreground uppercase">
                  {feature.flowCode}
                </span>
                <span className="inline-block size-1.5 rounded-full bg-foreground/20 transition-colors group-hover:bg-primary" />
              </div>

              <span className="mt-8 block text-5xl font-light text-primary tabular-nums">
                {feature.index}
              </span>

              <div className="mt-6 space-y-3">
                <h3 className="text-xl font-medium tracking-tight text-foreground sm:text-2xl">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {t(feature.descriptionKey)}
                </p>
              </div>

              <div className="mt-auto pt-8">
                <div className="border-t border-border-subtle pt-4">
                  <span className="text-label text-muted-foreground uppercase">
                    {feature.metricCode}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
