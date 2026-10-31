import { requireActiveOrgId } from "@/lib/server/active-org";
import { CustomersTable } from "./_components/customers-table-section";

export default async function OrgCustomersPage() {
  const id = String(await requireActiveOrgId());

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <CustomersTable orgId={id} />
    </div>
  );
}
