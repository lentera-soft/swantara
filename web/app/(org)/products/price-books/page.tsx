import { requireActiveOrgId } from "@/lib/server/active-org";
import { PriceBooksSection } from "./_components/price-books-section";

export default async function OrgPriceBooksPage() {
  const id = String(await requireActiveOrgId());

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PriceBooksSection orgId={id} />
    </div>
  );
}
