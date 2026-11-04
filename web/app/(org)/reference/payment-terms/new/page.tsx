import { requireActiveOrgId } from "@/lib/server/active-org";
import { PaymentTermForm } from "../../_components/payment-term-form";

export default async function OrgReferenceNewPaymentTermPage() {
  const id = String(await requireActiveOrgId());
  return <PaymentTermForm orgId={id} />;
}
