import {
  Banknote,
  Briefcase,
  CalendarCheck2,
  CalendarOff,
  IdCard,
  Network,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { WorkspacePage } from "../_components/workspace-page";

export default async function HrWorkspacePage() {
  const t = await getTranslations("Workspaces.hr");
  const stepTitles = t.raw("stepTitles") as string[];
  const stepDescriptions = t.raw("stepDescriptions") as string[];
  const destTitles = t.raw("destTitles") as string[];
  const destDescriptions = t.raw("destDescriptions") as string[];

  return (
    <WorkspacePage
      accent={{
        hero: "border-rose-500/20 from-rose-500/10 via-card to-card",
        glow: "bg-rose-500/10",
        eyebrow: "border-rose-500/20 text-rose-700 dark:text-rose-300",
        hoverBorder: "hover:border-rose-500/35",
        hoverArrow: "group-hover:text-rose-600 dark:group-hover:text-rose-300",
      }}
      eyebrow={t("eyebrow")}
      eyebrowIcon={Users}
      title={t("title")}
      description={t("description")}
      primaryAction={{ label: t("primaryAction"), href: "/employees" }}
      secondaryAction={{ label: t("secondaryAction"), href: "/payroll-runs" }}
      workflowTitle={t("workflowTitle")}
      workflowDescription={t("workflowDescription")}
      steps={[
        {
          href: "/employees",
          title: stepTitles[0] ?? "",
          description: stepDescriptions[0] ?? "",
          icon: IdCard,
          iconClass: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
        },
        {
          href: "/attendance",
          title: stepTitles[1] ?? "",
          description: stepDescriptions[1] ?? "",
          icon: CalendarCheck2,
          iconClass: "bg-pink-500/10 text-pink-700 dark:text-pink-300",
        },
        {
          href: "/leave-requests",
          title: stepTitles[2] ?? "",
          description: stepDescriptions[2] ?? "",
          icon: CalendarOff,
          iconClass: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
        },
        {
          href: "/payroll-runs",
          title: stepTitles[3] ?? "",
          description: stepDescriptions[3] ?? "",
          icon: Banknote,
          iconClass: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
        },
      ]}
      linksTitle={t("linksTitle")}
      linksDescription={t("linksDescription")}
      destinations={[
        {
          href: "/employees",
          title: destTitles[0] ?? "",
          description: destDescriptions[0] ?? "",
          icon: Users,
          iconClass: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
        },
        {
          href: "/employees/departments",
          title: destTitles[1] ?? "",
          description: destDescriptions[1] ?? "",
          icon: Network,
          iconClass: "bg-pink-500/10 text-pink-700 dark:text-pink-300",
        },
        {
          href: "/leave-requests",
          title: destTitles[2] ?? "",
          description: destDescriptions[2] ?? "",
          icon: CalendarOff,
          iconClass: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
        },
        {
          href: "/attendance",
          title: destTitles[3] ?? "",
          description: destDescriptions[3] ?? "",
          icon: CalendarCheck2,
          iconClass: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
        },
        {
          href: "/payroll-runs",
          title: destTitles[4] ?? "",
          description: destDescriptions[4] ?? "",
          icon: Briefcase,
          iconClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
        },
      ]}
    />
  );
}
