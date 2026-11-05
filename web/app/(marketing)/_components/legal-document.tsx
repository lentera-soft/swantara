"use client";

import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PageHero, Section, SectionHeader } from "./swiss-layout";

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
      <PageHero
        eyebrow={t("badge")}
        title={t("title")}
        lead={t("intro")}
        actions={
          <p className="text-label text-muted-foreground uppercase tabular-nums lg:text-right">
            {t("updated")}
          </p>
        }
      />

      {/* Contents (sticky, cols 1–3) beside the document (cols 5–11) */}
      <Section className="lg:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          <nav aria-label={t("badge")} className="hidden lg:col-span-3 lg:block">
            <ol className="sticky top-28 divide-y divide-border-subtle border-y border-border-subtle">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex items-baseline gap-3 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span className="text-label text-primary tabular-nums">{section.index}</span>
                    <span>{t(section.titleKey)}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="lg:col-span-7 lg:col-start-5">
            {sections.map((section) => (
              <article
                key={section.id}
                id={section.id}
                data-gsap="fade-up"
                className="scroll-mt-28 border-t border-border-subtle pt-6 pb-14 first:border-t-0 first:pt-0 lg:first:border-t lg:first:pt-6"
              >
                <span className="text-label text-primary tabular-nums">{section.index}</span>
                <h2 className="mt-3 text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
                  {t(section.titleKey)}
                </h2>
                <div className="mt-6 max-w-2xl space-y-5">
                  {section.paragraphKeys.map((paragraphKey) => (
                    <p
                      key={paragraphKey}
                      className="text-base leading-relaxed text-muted-foreground sm:text-lg"
                    >
                      {t(paragraphKey)}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </Section>

      <Section tone="warm">
        <SectionHeader eyebrow={t("badge")} title={t("relatedTitle")}>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("relatedNote")}{" "}
            <a
              href={`mailto:${email}`}
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              {email}
            </a>
          </p>
        </SectionHeader>

        <ul className="mt-16 grid grid-cols-1 border-t border-l border-border-subtle sm:grid-cols-3">
          {relatedLinks.map((link) => (
            <li key={link.href} className="border-r border-b border-border-subtle">
              <Link
                href={link.href}
                className="group flex items-center justify-between p-6 text-lg font-medium tracking-tight text-foreground transition-colors hover:bg-background lg:p-8"
              >
                <span>{tFooter(link.labelKey)}</span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            </li>
          ))}
          <li className="border-r border-b border-border-subtle">
            <Link
              href="/contact"
              className="group flex items-center justify-between p-6 text-lg font-medium tracking-tight text-foreground transition-colors hover:bg-background lg:p-8"
            >
              <span>{tFooter("contact")}</span>
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </li>
        </ul>
      </Section>
    </div>
  );
}
