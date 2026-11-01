import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { LocalizationSection } from "../_components/localization-section";

export default async function OrgReferenceLocalizationPage() {
  const t = await getTranslations("Reference");
  const id = String(await requireActiveOrgId());
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader title={t("localizationProfilesTitle")} description={t("description")} />
      <LocalizationSection orgId={id} />
    </div>
  );
}
