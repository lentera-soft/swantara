import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/back-link";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { LeadFormEdit } from "../../../_components/lead-form";

export default async function OrgCrmEditLeadPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  const id = String(await requireActiveOrgId());
  const t = await getTranslations("Crm");
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <BackLink href="/crm/leads">{t("backToLeads")}</BackLink>
      <LeadFormEdit orgId={id} kind="lead" id={leadId} cancelHref="/crm/leads" />
    </div>
  );
}
