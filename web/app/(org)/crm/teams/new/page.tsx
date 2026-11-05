import { getTranslations } from "next-intl/server";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { TeamForm } from "../../_components/team-form";

export default async function OrgCrmNewTeamPage() {
  const id = String(await requireActiveOrgId());
  const t = await getTranslations("Crm");
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <TeamForm orgId={id} />
    </div>
  );
}
