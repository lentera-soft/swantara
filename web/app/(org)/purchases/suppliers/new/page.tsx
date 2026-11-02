import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/back-link";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { SupplierForm } from "../_components/supplier-form";

export default async function OrgNewSupplierPage() {
  const id = String(await requireActiveOrgId());
  const t = await getTranslations("Purchases");

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <BackLink href="/purchases/suppliers">{t("backToSuppliers")}</BackLink>
      <SupplierForm orgId={id} />
    </div>
  );
}
