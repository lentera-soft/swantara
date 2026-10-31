import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { Suspense } from "react";
import { getClientMessages } from "@/lib/i18n/client-messages";
import { MarketingShell } from "./_components/marketing-shell";

export type MarketingLayoutProps = {
  children: React.ReactNode;
};

export default async function MarketingLayout({ children }: MarketingLayoutProps) {
  const locale = await getLocale();
  const messages = await getClientMessages(["Marketing", "Common", "Locale"]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Suspense fallback={null}>
        <MarketingShell>{children}</MarketingShell>
      </Suspense>
    </NextIntlClientProvider>
  );
}
