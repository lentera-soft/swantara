"use client";

import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import { splitTitle } from "../../_components/marketing-utils";
import { SwissIndexBadge } from "../../_components/swiss-grid-mark";
import { ContactForm } from "./contact-form";
import { CONTACT_DIRECTORY_CELLS } from "./contact-utils";

export function ContactSection() {
  const t = useTranslations("Marketing.contact");

  return (
    <div data-slot="contact-section">
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

            <div data-gsap="hero-meta" className="flex items-end lg:col-span-4">
              <p className="text-lg leading-relaxed text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="mb-8 space-y-2">
                <SwissIndexBadge label={t("formTitle")} />
                <h2 className="text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
                  {t("formTitle")}
                </h2>
                <p className="text-base text-muted-foreground">{t("formDescription")}</p>
              </div>
              <ContactForm />
            </div>

            <div className="space-y-6 lg:col-span-4 lg:col-start-9">
              {CONTACT_DIRECTORY_CELLS.map((cell) => (
                <div
                  key={cell.id}
                  className="rounded-2xl border border-border/60 bg-muted/25 p-6 transition-colors hover:bg-muted/40"
                >
                  <h3 className="text-sm font-medium text-muted-foreground">{t(cell.titleKey)}</h3>
                  <p className="mt-2 text-base leading-relaxed text-foreground">
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
        </div>
      </section>

      <section className="border-t border-border/60 bg-surface-warm">
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
              <Button size="lg" className="w-full justify-between rounded-full px-5" asChild>
                <Link href="/register">
                  <span>{t("ctaPrimary")}</span>
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full justify-between rounded-full px-5"
                asChild
              >
                <Link href="/product">
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
