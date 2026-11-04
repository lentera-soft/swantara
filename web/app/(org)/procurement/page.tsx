import { ClipboardPlus, Files, Handshake, ShoppingCart, Truck, Undo2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { WorkspacePage } from "../_components/workspace-page";

export default async function ProcurementWorkspacePage() {
  const t = await getTranslations("Workspaces.procurement");
  const stepTitles = t.raw("stepTitles") as string[];
  const stepDescriptions = t.raw("stepDescriptions") as string[];
  const destTitles = t.raw("destTitles") as string[];
  const destDescriptions = t.raw("destDescriptions") as string[];

  return (
    <WorkspacePage
      accent={{
        hero: "border-violet-500/20 from-violet-500/10 via-card to-card",
        glow: "bg-violet-500/10",
        eyebrow: "border-violet-500/20 text-violet-700 dark:text-violet-300",
        hoverBorder: "hover:border-violet-500/35",
        hoverArrow: "group-hover:text-violet-600 dark:group-hover:text-violet-300",
      }}
      eyebrow={t("eyebrow")}
      eyebrowIcon={ShoppingCart}
      title={t("title")}
      description={t("description")}
      primaryAction={{ label: t("primaryAction"), href: "/purchases" }}
      secondaryAction={{ label: t("secondaryAction"), href: "/purchases/suppliers" }}
      workflowTitle={t("workflowTitle")}
      workflowDescription={t("workflowDescription")}
      steps={[
        {
          href: "/purchases/purchase-requests",
          title: stepTitles[0] ?? "",
          description: stepDescriptions[0] ?? "",
          icon: ClipboardPlus,
          iconClass: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
        },
        {
          href: "/purchases/quote-requests",
          title: stepTitles[1] ?? "",
          description: stepDescriptions[1] ?? "",
          icon: Files,
          iconClass: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
        },
        {
          href: "/purchases",
          title: stepTitles[2] ?? "",
          description: stepDescriptions[2] ?? "",
          icon: ShoppingCart,
          iconClass: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
        },
        {
          href: "/purchases/returns",
          title: stepTitles[3] ?? "",
          description: stepDescriptions[3] ?? "",
          icon: Undo2,
          iconClass: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
        },
      ]}
      linksTitle={t("linksTitle")}
      linksDescription={t("linksDescription")}
      destinations={[
        {
          href: "/purchases",
          title: destTitles[0] ?? "",
          description: destDescriptions[0] ?? "",
          icon: ShoppingCart,
          iconClass: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
        },
        {
          href: "/purchases/purchase-requests",
          title: destTitles[1] ?? "",
          description: destDescriptions[1] ?? "",
          icon: ClipboardPlus,
          iconClass: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
        },
        {
          href: "/purchases/quote-requests",
          title: destTitles[2] ?? "",
          description: destDescriptions[2] ?? "",
          icon: Files,
          iconClass: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
        },
        {
          href: "/purchases/suppliers",
          title: destTitles[3] ?? "",
          description: destDescriptions[3] ?? "",
          icon: Handshake,
          iconClass: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
        },
        {
          href: "/dropship",
          title: destTitles[4] ?? "",
          description: destDescriptions[4] ?? "",
          icon: Truck,
          iconClass: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
        },
      ]}
    />
  );
}
