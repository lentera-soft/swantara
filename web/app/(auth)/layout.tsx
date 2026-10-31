import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { Suspense } from "react";
import { getClientMessages } from "@/lib/i18n/client-messages";
import { DigitalFingerPrintProvider } from "@/providers/digital-fingerprint";
import { TanstackQueryProvider } from "@/providers/tanstack-query";

export type AuthLayoutProps = {
  children: React.ReactNode;
};

export default async function AuthLayout({ children }: AuthLayoutProps) {
  const locale = await getLocale();
  const messages = await getClientMessages(["Auth", "Common", "Error", "Locale"]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <TanstackQueryProvider>
        <DigitalFingerPrintProvider>
          <Suspense fallback={null}>
            <main className="min-h-screen" id="main">
              {children}
            </main>
          </Suspense>
        </DigitalFingerPrintProvider>
      </TanstackQueryProvider>
    </NextIntlClientProvider>
  );
}
