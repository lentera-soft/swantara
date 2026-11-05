"use client";

import { useTranslations } from "next-intl";
import { CtaPair, PageHero, Section, SectionHeader } from "../../_components/swiss-layout";
import { ContactForm } from "./contact-form";
import { CONTACT_DIRECTORY_CELLS } from "./contact-utils";

export function ContactSection() {
  const t = useTranslations("Marketing.contact");

  return (
    <div data-slot="contact-section">
      <PageHero eyebrow={t("badge")} title={t("title")} lead={t("subtitle")} />

      <Section>
        <SectionHeader
          eyebrow={t("formTitle")}
          title={t("formTitle")}
          lead={t("formDescription")}
        />

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          <div data-gsap="fade-up" className="lg:col-span-7">
            <ContactForm />
          </div>

          <div
            data-gsap="grid-stagger"
            className="divide-y divide-border-subtle border-y border-border-subtle lg:col-span-4 lg:col-start-9"
          >
            {CONTACT_DIRECTORY_CELLS.map((cell) => (
              <div key={cell.id} data-gsap-item className="py-6">
                <h3 className="text-label text-muted-foreground uppercase">{t(cell.titleKey)}</h3>
                <p className="mt-3 text-base leading-relaxed text-foreground">
                  {t(cell.descriptionKey)}
                </p>
                {cell.isEmail ? (
                  <a
                    href={`mailto:${t(cell.detailKey)}`}
                    className="mt-3 inline-flex text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                  >
                    {t(cell.detailKey)}
                  </a>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">{t(cell.detailKey)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section tone="warm">
        <SectionHeader eyebrow={t("badge")} title={t("ctaTitle")} lead={t("ctaSubtitle")}>
          <CtaPair
            primary={{ href: "/register", label: t("ctaPrimary") }}
            secondary={{ href: "/product", label: t("ctaSecondary") }}
          />
        </SectionHeader>
      </Section>
    </div>
  );
}
