import { requireActiveOrgId } from "@/lib/server/active-org";
import { LeadsSection } from "../_components/leads-section";

export default async function OrgCrmLeadsPage() {
  const id = String(await requireActiveOrgId());
  return <LeadsSection orgId={id} />;
}
