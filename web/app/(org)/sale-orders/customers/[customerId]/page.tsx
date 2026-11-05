import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/back-link";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { CustomerDetail } from "../_components/customer-detail-section";

export default async function OrgCustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const t = await getTranslations("Sales");
  const { customerId } = await params;
  const id = String(await requireActiveOrgId());

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <BackLink href="/sale-orders/customers">{t("backToCustomers")}</BackLink>
      <CustomerDetail orgId={id} customerId={customerId} />
    </div>
  );
}
