"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { HOME_WORKFLOW_STEPS, splitTitle } from "./marketing-utils";

export function HomeWorkflowSection() {
  const t = useTranslations("Marketing.home");

  return (
    <section
      data-slot="home-workflow-section"
      className="border-t border-border-subtle bg-surface-warm"
    >
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <div
          data-gsap="section-header"
          className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-16"
        >
          <div className="lg:col-span-5">
            <p className="text-label text-muted-foreground uppercase">{t("workflowEyebrow")}</p>
            <h2 className="mt-4 text-headline text-foreground">
              {splitTitle(t("workflowTitle")).map((line, idx) => (
                <span key={line} className={cn("block", idx > 0 && "text-muted-foreground")}>
                  {line}
                </span>
              ))}
            </h2>
          </div>

          <div className="flex items-end lg:col-span-5 lg:col-start-8">
            <p className="text-lg leading-relaxed text-muted-foreground">{t("workflowSubtitle")}</p>
          </div>
        </div>

        <div
          data-gsap="grid-stagger"
          className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3 lg:gap-12"
        >
          {HOME_WORKFLOW_STEPS.map((step) => (
            <div key={step.id} data-gsap-item className="space-y-5">
              <span className="block text-5xl font-light text-primary/25 tabular-nums">
                {step.index}
              </span>
              <div className="space-y-3">
                <h3 className="text-xl font-medium tracking-tight text-foreground sm:text-2xl">
                  {t(step.titleKey)}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {t(step.descriptionKey)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          data-gsap="section-header"
          data-gsap-parallax
          data-gsap-speed="0.04"
          className="mt-20 grid grid-cols-1 gap-8 rounded-2xl border border-border-subtle bg-background p-8 sm:p-10 lg:grid-cols-12 lg:p-12"
        >
          <div className="lg:col-span-4">
            <p className="text-label text-muted-foreground uppercase">{t("testimonialEyebrow")}</p>
            <div className="mt-4">
              <p className="text-base font-medium text-foreground">{t("testimonialName")}</p>
              <p className="text-sm text-muted-foreground">
                {t("testimonialRole")} — {t("testimonialCompany")}
              </p>
            </div>
          </div>

          <div className="flex items-center lg:col-span-8">
            <blockquote className="text-xl font-normal leading-snug text-foreground sm:text-2xl lg:text-3xl">
              &ldquo;{t("testimonialQuote")}&rdquo;
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
}
