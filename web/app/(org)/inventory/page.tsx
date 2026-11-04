import {
  ArrowLeftRight,
  Boxes,
  ClipboardList,
  MoveHorizontal,
  Package,
  Warehouse,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { WorkspacePage } from "../_components/workspace-page";

export default async function InventoryWorkspacePage() {
  const t = await getTranslations("Workspaces.inventory");
  const stepTitles = t.raw("stepTitles") as string[];
  const stepDescriptions = t.raw("stepDescriptions") as string[];
  const destTitles = t.raw("destTitles") as string[];
  const destDescriptions = t.raw("destDescriptions") as string[];

  return (
    <WorkspacePage
      accent={{
        hero: "border-sky-500/20 from-sky-500/10 via-card to-card",
        glow: "bg-sky-500/10",
        eyebrow: "border-sky-500/20 text-sky-700 dark:text-sky-300",
        hoverBorder: "hover:border-sky-500/35",
        hoverArrow: "group-hover:text-sky-600 dark:group-hover:text-sky-300",
      }}
      eyebrow={t("eyebrow")}
      eyebrowIcon={Boxes}
      title={t("title")}
      description={t("description")}
      primaryAction={{ label: t("primaryAction"), href: "/products" }}
      secondaryAction={{ label: t("secondaryAction"), href: "/stock" }}
      workflowTitle={t("workflowTitle")}
      workflowDescription={t("workflowDescription")}
      steps={[
        {
          href: "/products",
          title: stepTitles[0] ?? "",
          description: stepDescriptions[0] ?? "",
          icon: Package,
          iconClass: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
        },
        {
          href: "/stock",
          title: stepTitles[1] ?? "",
          description: stepDescriptions[1] ?? "",
          icon: MoveHorizontal,
          iconClass: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
        },
        {
          href: "/stock/warehouse-transfers",
          title: stepTitles[2] ?? "",
          description: stepDescriptions[2] ?? "",
          icon: ArrowLeftRight,
          iconClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
        },
        {
          href: "/stock/counts",
          title: stepTitles[3] ?? "",
          description: stepDescriptions[3] ?? "",
          icon: ClipboardList,
          iconClass: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
        },
      ]}
      linksTitle={t("linksTitle")}
      linksDescription={t("linksDescription")}
      destinations={[
        {
          href: "/products",
          title: destTitles[0] ?? "",
          description: destDescriptions[0] ?? "",
          icon: Package,
          iconClass: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
        },
        {
          href: "/stock",
          title: destTitles[1] ?? "",
          description: destDescriptions[1] ?? "",
          icon: MoveHorizontal,
          iconClass: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
        },
        {
          href: "/stock/warehouses",
          title: destTitles[2] ?? "",
          description: destDescriptions[2] ?? "",
          icon: Warehouse,
          iconClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
        },
        {
          href: "/stock/counts",
          title: destTitles[3] ?? "",
          description: destDescriptions[3] ?? "",
          icon: ClipboardList,
          iconClass: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
        },
        {
          href: "/stock/reorder-rules",
          title: destTitles[4] ?? "",
          description: destDescriptions[4] ?? "",
          icon: Boxes,
          iconClass: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
        },
      ]}
    />
  );
}
