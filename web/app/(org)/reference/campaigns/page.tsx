import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { CampaignsSection } from "../_components/campaigns-section";

export default async function OrgReferenceCampaignsPage() {
  const t = await getTranslations("Reference");
  const id = String(await requireActiveOrgId());
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader title={t("campaignsTitle")} description={t("description")} />
      <CampaignsSection orgId={id} />
    </div>
  );
}
