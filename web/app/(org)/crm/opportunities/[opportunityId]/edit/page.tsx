import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/back-link";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { LeadFormEdit } from "../../../_components/lead-form";

export default async function OrgCrmEditOpportunityPage({
  params,
}: {
  params: Promise<{ opportunityId: string }>;
}) {
  const { opportunityId } = await params;
  const id = String(await requireActiveOrgId());
  const t = await getTranslations("Crm");
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <BackLink href="/crm/opportunities">{t("backToOpportunities")}</BackLink>
      <LeadFormEdit
        orgId={id}
        kind="opportunity"
        id={opportunityId}
        cancelHref="/crm/opportunities"
      />
    </div>
  );
}
