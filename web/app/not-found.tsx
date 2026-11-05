import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/button";

export default async function NotFound() {
  const t = await getTranslations("NotFound");
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-4 py-16 text-center">
      <div className="flex flex-col items-center gap-4">
        <FileQuestion className="size-12 text-primary" aria-hidden />
        <p className="text-label text-muted-foreground uppercase">404</p>
        <h1 className="text-4xl leading-[1.05] font-medium tracking-tight text-balance sm:text-5xl">
          {t("title")}
        </h1>
        <p className="max-w-md text-base text-muted-foreground text-pretty">{t("description")}</p>
        <Button size="lg" shape="pill" asChild className="mt-4 px-6">
          <Link href="/dashboard">{t("backToHome")}</Link>
        </Button>
      </div>
    </main>
  );
}
