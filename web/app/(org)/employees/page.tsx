import { requireActiveOrgId } from "@/lib/server/active-org";
import { EmployeesTable } from "./_components/employees-table-section";

export default async function OrgEmployeesPage() {
  const id = String(await requireActiveOrgId());
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <EmployeesTable orgId={id} />
    </div>
  );
}
