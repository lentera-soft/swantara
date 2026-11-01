import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { FxRatesSection } from "../_components/fx-rates-section";

export default async function OrgReferenceFxRatesPage() {
  const t = await getTranslations("Reference");
  const id = String(await requireActiveOrgId());
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader title={t("fxRatesTitle")} description={t("description")} />
      <FxRatesSection orgId={id} />
    </div>
  );
}
