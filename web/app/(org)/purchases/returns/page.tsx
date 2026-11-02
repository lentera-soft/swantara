import { getTranslations } from "next-intl/server";
import { RmasSection } from "@/app/(org)/sale-orders/returns/_components/rmas-section";
import { PageHeader } from "@/components/page-header";
import { requireActiveOrgId } from "@/lib/server/active-org";

export default async function OrgSupplierReturnsPage() {
  const id = String(await requireActiveOrgId());
  const t = await getTranslations("Purchases");
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader title={t("supplierReturnsTitle")} description={t("supplierReturnsSubtitle")} />
      <RmasSection orgId={id} rmaType="vendor_return" />
    </div>
  );
}
