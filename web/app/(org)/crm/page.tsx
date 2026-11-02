import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck2,
  ContactRound,
  Inbox,
  Megaphone,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/button";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { PipelineSection } from "./_components/pipeline-section";

export default async function OrgCrmPage() {
  const id = String(await requireActiveOrgId());
  const t = await getTranslations("Crm");

  const destinations = [
    {
      href: "/crm/inquiries",
      title: t("workspaceInquiriesTitle"),
      description: t("workspaceInquiriesDescription"),
      icon: Inbox,
      iconClassName: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    },
    {
      href: "/crm/leads",
      title: t("workspaceLeadsTitle"),
      description: t("workspaceLeadsDescription"),
      icon: ContactRound,
      iconClassName: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    },
    {
      href: "/crm/opportunities",
      title: t("workspaceOpportunitiesTitle"),
      description: t("workspaceOpportunitiesDescription"),
      icon: Target,
      iconClassName: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    },
    {
      href: "/crm/activities",
      title: t("workspaceActivitiesTitle"),
      description: t("workspaceActivitiesDescription"),
      icon: CalendarCheck2,
      iconClassName: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    },
    {
      href: "/crm/campaigns",
      title: t("workspaceCampaignsTitle"),
      description: t("workspaceCampaignsDescription"),
      icon: Megaphone,
      iconClassName: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    },
  ];

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <section className="relative isolate overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-card px-5 py-6 sm:px-8 sm:py-8">
        <div
          aria-hidden="true"
          className="absolute -right-14 -top-20 -z-10 size-64 rounded-full bg-primary/10 blur-3xl"
        />
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/70 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles aria-hidden="true" className="size-3.5" />
            {t("workspaceEyebrow")}
          </div>
          <h1 className="font-heading text-3xl leading-tight tracking-tight text-balance sm:text-4xl">
            {t("workspaceTitle")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("workspaceDescription")}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/crm/inquiries">
                {t("workspacePrimaryAction")}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Link
              href="/crm/leads"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-foreground transition-colors hover:bg-background/70"
            >
              {t("workspaceSecondaryAction")}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="crm-workspace-links" className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="crm-workspace-links" className="font-heading text-xl tracking-tight">
              {t("workspaceLinksTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("workspaceLinksDescription")}</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {destinations.map(({ href, title, description, icon: Icon, iconClassName }) => (
            <Link
              key={href}
              href={href}
              className="group flex min-h-40 flex-col rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/35 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:p-5"
            >
              <span
                className={`mb-4 flex size-10 items-center justify-center rounded-xl ${iconClassName}`}
              >
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span className="flex items-center justify-between gap-2 font-heading text-base">
                {title}
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                />
              </span>
              <span className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {description}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-label={t("workspacePipelineSection")} className="flex flex-col gap-3">
        <div>
          <h2 className="font-heading text-xl tracking-tight">{t("workspacePipelineSection")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("workspacePipelineDescription")}</p>
        </div>
        <PipelineSection orgId={id} />
      </section>
    </div>
  );
}
