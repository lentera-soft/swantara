import {
  AppWindow,
  ArrowUpRight,
  Calculator,
  Database,
  Factory,
  FolderKanban,
  Handshake,
  Store,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function AppsPage() {
  const t = await getTranslations("Apps");

  const apps = [
    {
      href: "/crm",
      label: t("moduleCrm"),
      description: t("descCrm"),
      icon: Handshake,
      iconClass: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
    },
    {
      href: "/production",
      label: t("moduleProduction"),
      description: t("descProduction"),
      icon: Factory,
      iconClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    },
    {
      href: "/inventory",
      label: t("moduleInventory"),
      description: t("descInventory"),
      icon: Warehouse,
      iconClass: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    },
    {
      href: "/procurement",
      label: t("moduleProcurement"),
      description: t("descProcurement"),
      icon: Truck,
      iconClass: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    },
    {
      href: "/hr",
      label: t("moduleHr"),
      description: t("descHr"),
      icon: Users,
      iconClass: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    },
    {
      href: "/project-management",
      label: t("moduleProjectManagement"),
      description: t("descProjectManagement"),
      icon: FolderKanban,
      iconClass: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
    },
    {
      href: "/finance",
      label: t("moduleFinance"),
      description: t("descFinance"),
      icon: Calculator,
      iconClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    },
    {
      href: "/sales-service",
      label: t("moduleSalesService"),
      description: t("descSalesService"),
      icon: Store,
      iconClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    },
    {
      href: "/reference",
      label: t("moduleReference"),
      description: t("descReference"),
      icon: Database,
      iconClass: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
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
            <AppWindow aria-hidden="true" className="size-3.5" />
            {t("launcherLabel")}
          </div>
          <h1 className="font-heading text-3xl leading-tight tracking-tight text-balance sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("description")}
          </p>
        </div>
      </section>

      <section aria-label={t("title")} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {apps.map(({ href, label, description, icon: Icon, iconClass }) => (
          <Link
            key={href}
            href={href}
            className="group flex min-h-32 flex-col rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/35 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:p-5"
          >
            <span
              className={`mb-3 flex size-10 items-center justify-center rounded-xl ${iconClass}`}
            >
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <span className="flex items-center justify-between gap-2 font-heading text-base">
              {label}
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
      </section>
    </div>
  );
}
