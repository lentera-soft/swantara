import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/back-link";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { CustomerForm } from "../_components/customer-form";

export default async function OrgNewCustomerPage() {
  const id = String(await requireActiveOrgId());
  const t = await getTranslations("Sales");

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <BackLink href="/sale-orders/customers">{t("backToCustomers")}</BackLink>
      <CustomerForm orgId={id} />
    </div>
  );
}
