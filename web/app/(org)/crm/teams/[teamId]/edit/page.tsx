import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/back-link";
import { requireActiveOrgId } from "@/lib/server/active-org";
import type { SalesGroup } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { TeamForm } from "../../../_components/team-form";

export default async function OrgCrmEditTeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const id = String(await requireActiveOrgId());
  const t = await getTranslations("Crm");
  let team: SalesGroup | null = null;
  try {
    const result = await getSwantaraService().salesGroups.get(Number(id), Number(teamId));
    team = result.team;
  } catch {
    team = null;
  }
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <BackLink href="/crm/teams">{t("backToTeams")}</BackLink>
      {team ? (
        <TeamForm orgId={id} initial={team} />
      ) : (
        <p className="text-sm text-destructive">{t("teamNotFound")}</p>
      )}
    </div>
  );
}
