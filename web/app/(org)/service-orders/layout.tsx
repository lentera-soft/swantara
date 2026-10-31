import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";

export default async function ServiceLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("Service");
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      {children}
    </div>
  );
}
