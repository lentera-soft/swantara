import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { TeamsSection } from "../_components/teams-section";

export default async function OrgCrmTeamsPage() {
  const id = String(await requireActiveOrgId());
  const t = await getTranslations("Crm");
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader title={t("teamsTitle")} description={t("teamsSubtitle")} />
      <TeamsSection orgId={id} />
    </div>
  );
}
