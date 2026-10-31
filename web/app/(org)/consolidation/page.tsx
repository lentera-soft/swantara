import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { ConsolidationSection } from "./_components/consolidation-section";

export default async function ConsolidationPage() {
  const t = await getTranslations("Consolidation");
  const id = String(await requireActiveOrgId());
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <ConsolidationSection orgId={id} />
    </div>
  );
}
