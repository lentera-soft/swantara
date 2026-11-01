import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { CarriersSection } from "../_components/carriers-section";

export default async function OrgReferenceCarriersPage() {
  const t = await getTranslations("Reference");
  const id = String(await requireActiveOrgId());
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader title={t("carriersTitle")} description={t("description")} />
      <CarriersSection orgId={id} />
    </div>
  );
}
