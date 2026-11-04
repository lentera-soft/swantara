import { ArrowRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/button";

export type WorkspaceAccent = {
  hero: string;
  glow: string;
  eyebrow: string;
  hoverBorder: string;
  hoverArrow: string;
};

export type WorkspaceEntry = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClass: string;
};

type WorkspacePageProps = {
  accent: WorkspaceAccent;
  eyebrow: string;
  eyebrowIcon: LucideIcon;
  title: string;
  description: string;
  primaryAction: { label: string; href: string };
  secondaryAction: { label: string; href: string };
  workflowTitle: string;
  workflowDescription: string;
  steps: WorkspaceEntry[];
  linksTitle: string;
  linksDescription: string;
  destinations: WorkspaceEntry[];
  destinationGridClass?: string;
};

export function WorkspacePage({
  accent,
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  description,
  primaryAction,
  secondaryAction,
  workflowTitle,
  workflowDescription,
  steps,
  linksTitle,
  linksDescription,
  destinations,
  destinationGridClass = "grid gap-3 sm:grid-cols-2 xl:grid-cols-5",
}: WorkspacePageProps) {
  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <section
        className={`relative isolate overflow-hidden rounded-2xl border bg-gradient-to-br px-5 py-6 sm:px-8 sm:py-8 ${accent.hero}`}
      >
        <div
          aria-hidden="true"
          className={`absolute -right-14 -top-20 -z-10 size-64 rounded-full blur-3xl ${accent.glow}`}
        />
        <div className="max-w-3xl">
          <div
            className={`mb-4 inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium ${accent.eyebrow}`}
          >
            <EyebrowIcon aria-hidden="true" className="size-3.5" />
            {eyebrow}
          </div>
          <h1 className="font-heading text-3xl leading-tight tracking-tight text-balance sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href={primaryAction.href}>
                {primaryAction.label}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Link
              href={secondaryAction.href}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-foreground transition-colors hover:bg-background/70"
            >
              {secondaryAction.label}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section aria-label={workflowTitle} className="flex flex-col gap-4">
        <div>
          <h2 className="font-heading text-xl tracking-tight">{workflowTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{workflowDescription}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(
            (
              { href, title: stepTitle, description: stepDescription, icon: Icon, iconClass },
              index,
            ) => (
              <Link
                key={`${href}-${stepTitle}`}
                href={href}
                className={`group flex min-h-36 flex-col rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:p-5 ${accent.hoverBorder}`}
              >
                <div className="mb-3 flex items-center gap-3">
                  <span
                    className={`flex size-9 items-center justify-center rounded-lg ${iconClass}`}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <span className="flex size-6 items-center justify-center rounded-full border border-border bg-muted text-xs font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                </div>
                <span className="flex items-center justify-between gap-2 font-heading text-base">
                  {stepTitle}
                  <ArrowUpRight
                    aria-hidden="true"
                    className={`size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${accent.hoverArrow}`}
                  />
                </span>
                <span className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {stepDescription}
                </span>
              </Link>
            ),
          )}
        </div>
      </section>

      <section aria-label={linksTitle} className="flex flex-col gap-3">
        <div>
          <h2 className="font-heading text-xl tracking-tight">{linksTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{linksDescription}</p>
        </div>
        <div className={destinationGridClass}>
          {destinations.map(
            (
              { href, title: destTitle, description: destDescription, icon: Icon, iconClass },
              index,
            ) => (
              <Link
                key={href}
                href={href}
                className={`group flex min-h-40 flex-col rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:p-5 ${accent.hoverBorder} ${
                  index === destinations.length - 1 && destinations.length === 5
                    ? "sm:col-span-2 xl:col-span-1"
                    : ""
                }`}
              >
                <span
                  className={`mb-4 flex size-10 items-center justify-center rounded-xl ${iconClass}`}
                >
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="flex items-center justify-between gap-2 font-heading text-base">
                  {destTitle}
                  <ArrowUpRight
                    aria-hidden="true"
                    className={`size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${accent.hoverArrow}`}
                  />
                </span>
                <span className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {destDescription}
                </span>
              </Link>
            ),
          )}
        </div>
      </section>
    </div>
  );
}
