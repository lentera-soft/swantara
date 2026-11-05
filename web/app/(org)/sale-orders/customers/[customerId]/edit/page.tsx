import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/back-link";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { CustomerForm } from "../../_components/customer-form";

export default async function OrgEditCustomerPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const t = await getTranslations("Sales");
  const { customerId } = await params;
  const id = String(await requireActiveOrgId());

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <BackLink href={`/sale-orders/customers/${customerId}`}>{t("backToCustomer")}</BackLink>
      <CustomerForm orgId={id} customerId={customerId} />
    </div>
  );
}
