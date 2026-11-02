import { Suspense } from "react";
import { ProductsSubNav } from "./_components/products-subnav";

export default async function ProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <Suspense fallback={null}>
        <ProductsSubNav />
      </Suspense>
      {children}
    </div>
  );
}
