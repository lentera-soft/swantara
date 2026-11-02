import { PageHeader } from "@/components/page-header";

export default async function TeamLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader title={"Team"} description={"Employees, departments, and job positions."} />
      {children}
    </div>
  );
}
