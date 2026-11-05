import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { TableDemo } from "./_components/table-demo";

export const metadata: Metadata = {
  title: "Table demo",
  robots: { index: false, follow: false },
};

// Developer playground for InteractiveEntityTable. Not shipped to production.
export default function TableDemoPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader
        title="Interactive table demo"
        description="Sample sales orders (generated locally, no API calls) that exercise every InteractiveEntityTable feature."
      />
      <TableDemo />
    </div>
  );
}
