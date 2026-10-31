import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/back-link";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { ConsolidationRunDetailSection } from "../_components/consolidation-run-detail-section";

export default async function ConsolidationRunDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const t = await getTranslations("Consolidation");
  const id = String(await requireActiveOrgId());
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <BackLink href={"/consolidation"}>{t("backToRuns")}</BackLink>
      <ConsolidationRunDetailSection orgId={id} runId={runId} />
    </div>
  );
}
