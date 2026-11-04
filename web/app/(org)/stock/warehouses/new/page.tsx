import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/back-link";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { WarehouseForm } from "../_components/warehouse-form";

export default async function OrgNewWarehousePage() {
  const t = await (getTranslations as unknown as (ns: string) => Promise<(key: string) => string>)(
    "Stock",
  );
  const id = String(await requireActiveOrgId());

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <BackLink href="/stock/warehouses">{t("backToWarehouses")}</BackLink>
      <WarehouseForm orgId={id} />
    </div>
  );
}
