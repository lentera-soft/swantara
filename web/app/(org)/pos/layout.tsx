import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";

export default async function PosLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("Pos");
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      {children}
    </div>
  );
}
