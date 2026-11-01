import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { DimensionsSection } from "../_components/dimensions-section";

export default async function OrgReferenceDimensionsPage() {
  const t = await getTranslations("Reference");
  const id = String(await requireActiveOrgId());
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader title={t("dimensionsTitle")} description={t("description")} />
      <DimensionsSection orgId={id} />
    </div>
  );
}
