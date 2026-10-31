import { PageHeader } from "@/components/page-header";

export default async function SalesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader title={"Penjualan"} description={"Customers, sale orders, and returns."} />
      {children}
    </div>
  );
}
