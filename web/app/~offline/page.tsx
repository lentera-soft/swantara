import { getTranslations } from "next-intl/server";

export default async function OfflinePage() {
  const t = await getTranslations("Common");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">{t("offlineTitle")}</h1>
      <p className="text-muted-foreground">{t("offlineDescription")}</p>
    </main>
  );
}
