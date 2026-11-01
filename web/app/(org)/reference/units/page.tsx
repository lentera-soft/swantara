import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { UnitsSection } from "../_components/units-section";

export default async function OrgReferenceUnitsPage() {
  const t = await getTranslations("Reference");
  const id = String(await requireActiveOrgId());
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader title={t("unitsTitle")} description={t("description")} />
      <UnitsSection orgId={id} />
    </div>
  );
}
