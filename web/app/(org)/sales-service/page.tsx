import { ClipboardCheck, FileText, RefreshCw, Store, Wrench } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { WorkspacePage } from "../_components/workspace-page";

export default async function SalesServiceWorkspacePage() {
  const t = await getTranslations("Workspaces.salesService");
  const stepTitles = t.raw("stepTitles") as string[];
  const stepDescriptions = t.raw("stepDescriptions") as string[];
  const destTitles = t.raw("destTitles") as string[];
  const destDescriptions = t.raw("destDescriptions") as string[];

  return (
    <WorkspacePage
      accent={{
        hero: "border-blue-500/20 from-blue-500/10 via-card to-card",
        glow: "bg-blue-500/10",
        eyebrow: "border-blue-500/20 text-blue-700 dark:text-blue-300",
        hoverBorder: "hover:border-blue-500/35",
        hoverArrow: "group-hover:text-blue-600 dark:group-hover:text-blue-300",
      }}
      eyebrow={t("eyebrow")}
      eyebrowIcon={Store}
      title={t("title")}
      description={t("description")}
      primaryAction={{ label: t("primaryAction"), href: "/sale-orders" }}
      secondaryAction={{ label: t("secondaryAction"), href: "/pos" }}
      workflowTitle={t("workflowTitle")}
      workflowDescription={t("workflowDescription")}
      steps={[
        {
          href: "/sale-quotes",
          title: stepTitles[0] ?? "",
          description: stepDescriptions[0] ?? "",
          icon: FileText,
          iconClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
        },
        {
          href: "/sale-orders",
          title: stepTitles[1] ?? "",
          description: stepDescriptions[1] ?? "",
          icon: ClipboardCheck,
          iconClass: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
        },
        {
          href: "/pos",
          title: stepTitles[2] ?? "",
          description: stepDescriptions[2] ?? "",
          icon: Store,
          iconClass: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
        },
        {
          href: "/service-orders",
          title: stepTitles[3] ?? "",
          description: stepDescriptions[3] ?? "",
          icon: Wrench,
          iconClass: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
        },
      ]}
      linksTitle={t("linksTitle")}
      linksDescription={t("linksDescription")}
      destinations={[
        {
          href: "/sale-orders",
          title: destTitles[0] ?? "",
          description: destDescriptions[0] ?? "",
          icon: ClipboardCheck,
          iconClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
        },
        {
          href: "/sale-quotes",
          title: destTitles[1] ?? "",
          description: destDescriptions[1] ?? "",
          icon: FileText,
          iconClass: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
        },
        {
          href: "/pos",
          title: destTitles[2] ?? "",
          description: destDescriptions[2] ?? "",
          icon: Store,
          iconClass: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
        },
        {
          href: "/subscriptions",
          title: destTitles[3] ?? "",
          description: destDescriptions[3] ?? "",
          icon: RefreshCw,
          iconClass: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
        },
        {
          href: "/service-orders",
          title: destTitles[4] ?? "",
          description: destDescriptions[4] ?? "",
          icon: Wrench,
          iconClass: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
        },
      ]}
    />
  );
}
