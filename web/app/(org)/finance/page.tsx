import { BarChart3, BookOpen, Building, HandCoins, Receipt, Wallet } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { WorkspacePage } from "../_components/workspace-page";

export default async function FinanceWorkspacePage() {
  const t = await getTranslations("Workspaces.finance");
  const stepTitles = t.raw("stepTitles") as string[];
  const stepDescriptions = t.raw("stepDescriptions") as string[];
  const destTitles = t.raw("destTitles") as string[];
  const destDescriptions = t.raw("destDescriptions") as string[];

  return (
    <WorkspacePage
      accent={{
        hero: "border-emerald-500/20 from-emerald-500/10 via-card to-card",
        glow: "bg-emerald-500/10",
        eyebrow: "border-emerald-500/20 text-emerald-700 dark:text-emerald-300",
        hoverBorder: "hover:border-emerald-500/35",
        hoverArrow: "group-hover:text-emerald-600 dark:group-hover:text-emerald-300",
      }}
      eyebrow={t("eyebrow")}
      eyebrowIcon={Wallet}
      title={t("title")}
      description={t("description")}
      primaryAction={{ label: t("primaryAction"), href: "/accounting" }}
      secondaryAction={{ label: t("secondaryAction"), href: "/reports" }}
      workflowTitle={t("workflowTitle")}
      workflowDescription={t("workflowDescription")}
      steps={[
        {
          href: "/accounting",
          title: stepTitles[0] ?? "",
          description: stepDescriptions[0] ?? "",
          icon: BookOpen,
          iconClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        },
        {
          href: "/expenses",
          title: stepTitles[1] ?? "",
          description: stepDescriptions[1] ?? "",
          icon: HandCoins,
          iconClass: "bg-green-500/10 text-green-700 dark:text-green-300",
        },
        {
          href: "/fixed-assets",
          title: stepTitles[2] ?? "",
          description: stepDescriptions[2] ?? "",
          icon: Building,
          iconClass: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
        },
        {
          href: "/reports",
          title: stepTitles[3] ?? "",
          description: stepDescriptions[3] ?? "",
          icon: BarChart3,
          iconClass: "bg-lime-500/10 text-lime-700 dark:text-lime-300",
        },
      ]}
      linksTitle={t("linksTitle")}
      linksDescription={t("linksDescription")}
      destinations={[
        {
          href: "/accounting",
          title: destTitles[0] ?? "",
          description: destDescriptions[0] ?? "",
          icon: BookOpen,
          iconClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        },
        {
          href: "/expenses",
          title: destTitles[1] ?? "",
          description: destDescriptions[1] ?? "",
          icon: Receipt,
          iconClass: "bg-green-500/10 text-green-700 dark:text-green-300",
        },
        {
          href: "/fixed-assets",
          title: destTitles[2] ?? "",
          description: destDescriptions[2] ?? "",
          icon: Building,
          iconClass: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
        },
        {
          href: "/consolidation",
          title: destTitles[3] ?? "",
          description: destDescriptions[3] ?? "",
          icon: Wallet,
          iconClass: "bg-lime-500/10 text-lime-700 dark:text-lime-300",
        },
        {
          href: "/reports",
          title: destTitles[4] ?? "",
          description: destDescriptions[4] ?? "",
          icon: BarChart3,
          iconClass: "bg-green-600/10 text-green-700 dark:text-green-300",
        },
      ]}
    />
  );
}
