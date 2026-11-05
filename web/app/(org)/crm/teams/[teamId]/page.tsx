import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/back-link";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { TeamDetailSection } from "../../_components/team-detail-section";

export default async function OrgCrmTeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const id = String(await requireActiveOrgId());
  const t = await getTranslations("Crm");
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <BackLink href="/crm/teams">{t("backToTeams")}</BackLink>
      <TeamDetailSection orgId={id} teamId={teamId} />
    </div>
  );
}
