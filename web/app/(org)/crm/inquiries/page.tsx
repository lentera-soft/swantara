import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { InquiriesSection } from "../_components/inquiries-section";

export default async function OrgCrmInquiriesPage() {
  const id = String(await requireActiveOrgId());
  const t = await getTranslations("Crm");
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader title={t("inquiriesTitle")} description={t("inquiriesSubtitle")} />
      <InquiriesSection orgId={id} />
    </div>
  );
}
