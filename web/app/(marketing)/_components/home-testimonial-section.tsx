"use client";

import { useTranslations } from "next-intl";

export function HomeTestimonialSection() {
  const t = useTranslations("Marketing.home");

  return (
    <section
      data-slot="home-testimonial-section"
      className="border-t border-border-subtle bg-surface-warm"
    >
      <div className="px-4 sm:px-6 py-20 lg:px-8 lg:py-28">
        <div
          data-gsap="section-header"
          className="grid grid-cols-1 gap-8 rounded-2xl border border-border-subtle bg-background p-8 sm:p-10 lg:grid-cols-12 lg:p-12"
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
