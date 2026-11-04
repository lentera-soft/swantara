import { FolderKanban, Gauge, ListChecks, ShieldCheck, SquareKanban } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { WorkspacePage } from "../_components/workspace-page";

export default async function ProjectManagementWorkspacePage() {
  const t = await getTranslations("Workspaces.projectManagement");
  const stepTitles = t.raw("stepTitles") as string[];
  const stepDescriptions = t.raw("stepDescriptions") as string[];
  const destTitles = t.raw("destTitles") as string[];
  const destDescriptions = t.raw("destDescriptions") as string[];

  return (
    <WorkspacePage
      accent={{
        hero: "border-teal-500/20 from-teal-500/10 via-card to-card",
        glow: "bg-teal-500/10",
        eyebrow: "border-teal-500/20 text-teal-700 dark:text-teal-300",
        hoverBorder: "hover:border-teal-500/35",
        hoverArrow: "group-hover:text-teal-600 dark:group-hover:text-teal-300",
      }}
      eyebrow={t("eyebrow")}
      eyebrowIcon={FolderKanban}
      title={t("title")}
      description={t("description")}
      primaryAction={{ label: t("primaryAction"), href: "/projects" }}
      secondaryAction={{ label: t("secondaryAction"), href: "/quality" }}
      workflowTitle={t("workflowTitle")}
      workflowDescription={t("workflowDescription")}
      steps={[
        {
          href: "/projects",
          title: stepTitles[0] ?? "",
          description: stepDescriptions[0] ?? "",
          icon: SquareKanban,
          iconClass: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
        },
        {
          href: "/projects",
          title: stepTitles[1] ?? "",
          description: stepDescriptions[1] ?? "",
          icon: ListChecks,
          iconClass: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
        },
        {
          href: "/quality",
          title: stepTitles[2] ?? "",
          description: stepDescriptions[2] ?? "",
          icon: ShieldCheck,
          iconClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        },
        {
          href: "/projects",
          title: stepTitles[3] ?? "",
          description: stepDescriptions[3] ?? "",
          icon: Gauge,
          iconClass: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
        },
      ]}
      linksTitle={t("linksTitle")}
      linksDescription={t("linksDescription")}
      destinationGridClass="grid gap-3 sm:grid-cols-2"
      destinations={[
        {
          href: "/projects",
          title: destTitles[0] ?? "",
          description: destDescriptions[0] ?? "",
          icon: FolderKanban,
          iconClass: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
        },
        {
          href: "/quality",
          title: destTitles[1] ?? "",
          description: destDescriptions[1] ?? "",
          icon: ShieldCheck,
          iconClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        },
      ]}
    />
  );
}
