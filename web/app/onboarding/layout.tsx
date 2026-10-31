import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { getClientMessages } from "@/lib/i18n/client-messages";
import { DigitalFingerPrintProvider } from "@/providers/digital-fingerprint";
import { TanstackQueryProvider } from "@/providers/tanstack-query";

export type OnboardingLayoutProps = {
  children: React.ReactNode;
};

export default async function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const locale = await getLocale();
  const messages = await getClientMessages(["Common", "Error", "Locale", "Onboarding"]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <TanstackQueryProvider>
        <DigitalFingerPrintProvider>
          <main className="min-h-screen" id="main">
            {children}
          </main>
        </DigitalFingerPrintProvider>
      </TanstackQueryProvider>
    </NextIntlClientProvider>
  );
}
