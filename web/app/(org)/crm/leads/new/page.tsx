import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/back-link";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { LeadForm } from "../../_components/lead-form";

export default async function OrgCrmNewLeadPage() {
  const id = String(await requireActiveOrgId());
  const t = await getTranslations("Crm");
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <BackLink href="/crm/leads">{t("backToLeads")}</BackLink>
      <LeadForm orgId={id} type="prospect" cancelHref="/crm/leads" />
    </div>
  );
}
