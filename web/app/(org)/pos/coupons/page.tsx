import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { CouponsSection } from "./_components/coupons-section";

export default async function CouponsPage() {
  const t = await getTranslations("Pos");
  const id = String(await requireActiveOrgId());
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader title={t("couponsTitle")} description={t("couponsDescription")} />
      <CouponsSection orgId={id} />
    </div>
  );
}
