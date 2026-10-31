import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { InterorganizationSubNav } from "./_components/interorganization-subnav";

export default async function InterorganizationLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("Interorganization");
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <InterorganizationSubNav />
      {children}
    </div>
  );
}
