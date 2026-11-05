"use client";

import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/button";
import { splitTitle } from "./marketing-utils";
import { SwissIndexBadge } from "./swiss-grid-mark";

type LegalSectionNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type LegalSectionTitleKey = `section${LegalSectionNumber}Title`;

export type LegalParagraphKey = `section${LegalSectionNumber}P${1 | 2}`;

export type LegalSectionConfig = {
  id: string;
  index: string;
  titleKey: LegalSectionTitleKey;
  paragraphKeys: readonly LegalParagraphKey[];
};

export type LegalRelatedLink = {
  labelKey: "privacy" | "terms" | "dpa";
  href: string;
};

export type LegalDocumentProps = {
  namespace: "privacy" | "terms" | "dpa";
  email: string;
  sections: readonly LegalSectionConfig[];
  relatedLinks: readonly LegalRelatedLink[];
};

export function LegalDocument({ namespace, email, sections, relatedLinks }: LegalDocumentProps) {
  const t = useTranslations(`Marketing.${namespace}`);
  const tFooter = useTranslations("Marketing.footer");

  return (
    <div data-slot={`legal-${namespace}`}>
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
                {splitTitle(t("title")).map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h1>
            </div>

            <div data-gsap="hero-meta" className="flex flex-col justify-end gap-6 lg:col-span-4">
              <p className="text-lg leading-relaxed text-muted-foreground">{t("intro")}</p>
              <p className="font-mono text-xs text-muted-foreground tabular-nums">{t("updated")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border-subtle">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-12">
          <div className="divide-y divide-border-subtle">
            {sections.map((section) => (
              <div
                key={section.id}
                id={section.id}
                data-gsap="section-header"
                className="grid grid-cols-1 gap-8 py-12 lg:grid-cols-12 lg:gap-16"
              >
                <div className="lg:col-span-4">
                  <SwissIndexBadge index={section.index} label={t(section.titleKey)} />
                  <h2 className="mt-4 text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
                    {t(section.titleKey)}
                  </h2>
                </div>

                <div className="space-y-6 lg:col-span-7 lg:col-start-6">
                  {section.paragraphKeys.map((paragraphKey) => (
                    <p
                      key={paragraphKey}
                      className="text-base leading-relaxed text-muted-foreground sm:text-lg"
                    >
                      {t(paragraphKey)}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border-subtle bg-surface-warm">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div
            data-gsap="section-header"
            className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12"
          >
            <div className="lg:col-span-7">
              <SwissIndexBadge label={t("relatedTitle")} />
              <h2 className="mt-4 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                {t("relatedTitle")}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
                {t("relatedNote")}{" "}
                <a
                  href={`mailto:${email}`}
                  className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  {email}
                </a>
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:col-span-4 lg:col-start-9">
              {relatedLinks.map((link) => (
                <Button
                  key={link.href}
                  size="lg"
                  variant="outline"
                  shape="pill"
                  className="w-full justify-between px-5"
                  asChild
                >
                  <Link href={link.href}>
                    <span>{tFooter(link.labelKey)}</span>
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
              ))}
              <Button
                size="lg"
                variant="ghost"
                shape="pill"
                className="w-full justify-between px-5"
                asChild
              >
                <Link href="/contact">
                  <span>{tFooter("contact")}</span>
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
