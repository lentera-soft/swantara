import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { SettingsTabs } from "./_components/settings-tabs";

export default async function OrgSettingsPage() {
  const t = await getTranslations("Settings");
  const id = String(await requireActiveOrgId());

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <SettingsTabs orgId={id} />
    </div>
  );
}
