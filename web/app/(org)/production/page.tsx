import { BookOpen, CalendarRange, Factory, Package, PackageCheck, Tags } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { WorkspacePage } from "../_components/workspace-page";

export default async function ProductionWorkspacePage() {
  const t = await getTranslations("Workspaces.production");
  const stepTitles = t.raw("stepTitles") as string[];
  const stepDescriptions = t.raw("stepDescriptions") as string[];
  const destTitles = t.raw("destTitles") as string[];
  const destDescriptions = t.raw("destDescriptions") as string[];

  return (
    <WorkspacePage
      accent={{
        hero: "border-amber-500/20 from-amber-500/10 via-card to-card",
        glow: "bg-amber-500/10",
        eyebrow: "border-amber-500/20 text-amber-700 dark:text-amber-300",
        hoverBorder: "hover:border-amber-500/35",
        hoverArrow: "group-hover:text-amber-600 dark:group-hover:text-amber-300",
      }}
      eyebrow={t("eyebrow")}
      eyebrowIcon={Factory}
      title={t("title")}
      description={t("description")}
      primaryAction={{ label: t("primaryAction"), href: "/production-orders" }}
      secondaryAction={{ label: t("secondaryAction"), href: "/planning" }}
      workflowTitle={t("workflowTitle")}
      workflowDescription={t("workflowDescription")}
      steps={[
        {
          href: "/production-orders",
          title: stepTitles[0] ?? "",
          description: stepDescriptions[0] ?? "",
          icon: Factory,
          iconClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
        },
        {
          href: "/planning",
          title: stepTitles[1] ?? "",
          description: stepDescriptions[1] ?? "",
          icon: CalendarRange,
          iconClass: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
        },
        {
          href: "/products/recipes",
          title: stepTitles[2] ?? "",
          description: stepDescriptions[2] ?? "",
          icon: BookOpen,
          iconClass: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
        },
        {
          href: "/production-orders",
          title: stepTitles[3] ?? "",
          description: stepDescriptions[3] ?? "",
          icon: PackageCheck,
          iconClass: "bg-lime-500/10 text-lime-700 dark:text-lime-300",
        },
      ]}
      linksTitle={t("linksTitle")}
      linksDescription={t("linksDescription")}
      destinationGridClass="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      destinations={[
        {
          href: "/production-orders",
          title: destTitles[0] ?? "",
          description: destDescriptions[0] ?? "",
          icon: Package,
          iconClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
        },
        {
          href: "/planning",
          title: destTitles[1] ?? "",
          description: destDescriptions[1] ?? "",
          icon: CalendarRange,
          iconClass: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
        },
        {
          href: "/products/recipes",
          title: destTitles[2] ?? "",
          description: destDescriptions[2] ?? "",
          icon: BookOpen,
          iconClass: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
        },
        {
          href: "/products/price-books",
          title: destTitles[3] ?? "",
          description: destDescriptions[3] ?? "",
          icon: Tags,
          iconClass: "bg-lime-500/10 text-lime-700 dark:text-lime-300",
        },
      ]}
    />
  );
}
