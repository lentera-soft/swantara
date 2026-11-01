"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { HOME_FEATURE_CONFIGS, splitTitle } from "./marketing-utils";

export function HomeFeaturesSection() {
  const t = useTranslations("Marketing.home");
  const tActions = useTranslations("Marketing.actions");

  return (
    <section data-slot="home-features-section" className="border-t border-border-subtle">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <div
          data-gsap="section-header"
          className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-16"
        >
          <div className="lg:col-span-5">
            <p className="text-label text-muted-foreground uppercase">{t("featuresEyebrow")}</p>
            <h2 className="mt-4 text-headline text-foreground">
              {splitTitle(t("featuresTitle")).map((line, idx) => (
                <span key={line} className={cn("block", idx > 0 && "text-muted-foreground")}>
                  {line}
                </span>
              ))}
            </h2>
          </div>

          <div className="flex flex-col justify-end lg:col-span-5 lg:col-start-8">
            <p className="text-lg leading-relaxed text-muted-foreground">{t("featuresSubtitle")}</p>
            <div className="mt-6">
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
            </div>
          </div>
        </div>

        <div
          data-gsap="grid-stagger"
          className="mt-16 grid grid-cols-1 gap-px rounded-2xl bg-border/40 sm:grid-cols-2 lg:grid-cols-3"
        >
          {HOME_FEATURE_CONFIGS.map((feature) => (
            <article
              key={feature.id}
              data-gsap-item
              className="group bg-background p-6 transition-colors hover:bg-muted/30 sm:p-8"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-primary tabular-nums">
                  {feature.index}
                </span>
                <span className="text-xs text-muted-foreground">{feature.flowCode}</span>
              </div>

              <div className="mt-8 space-y-3">
                <h3 className="text-xl font-medium tracking-tight text-foreground sm:text-2xl">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {t(feature.descriptionKey)}
                </p>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-border/40 pt-4 text-xs text-muted-foreground">
                <span className="uppercase tracking-wide">{feature.metricCode}</span>
                <span className="inline-block size-1.5 rounded-full bg-foreground/20 transition-colors group-hover:bg-primary" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
