import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { IntegrationSection } from "./_components/integration-section";

export default async function IntegrationPage() {
  const t = await getTranslations("Integration");
  const id = String(await requireActiveOrgId());

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader force title={t("title")} description={t("pageDescription")} />
      <IntegrationSection orgId={id} />
    </div>
  );
}
