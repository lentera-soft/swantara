import { CustomersTable } from "./_components/customers-table-section";

export default async function OrgCustomersPage() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <CustomersTable />
    </div>
  );
}
