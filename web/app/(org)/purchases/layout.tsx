import { PageHeader } from "@/components/page-header";

export default async function PurchasesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader
        title={"Pembelian"}
        description={"Requisitions, quotes, orders, and landed costs — procure to pay."}
      />
      {children}
    </div>
  );
}
