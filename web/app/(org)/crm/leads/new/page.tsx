import { requireActiveOrgId } from "@/lib/server/active-org";
import { LeadForm } from "../../_components/lead-form";

export default async function OrgCrmNewLeadPage() {
  const id = String(await requireActiveOrgId());
  return <LeadForm orgId={id} type="prospect" cancelHref="/crm/leads" />;
}
