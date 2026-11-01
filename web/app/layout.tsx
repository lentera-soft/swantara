import { SerwistProvider } from "@serwist/turbopack/react";
import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import "@/styles/globals.css";

import DevtoolWarning from "@/app/_components/devtool-warning";
import { ReportWebVitals } from "@/app/_components/report-web-vitals";
import { ThemeScript } from "@/app/_components/theme-script";
import { SkipToMain } from "@/components/skip-to-main";
import { getClientMessages } from "@/lib/i18n/client-messages";
import { cn } from "@/lib/utils/style";
import { ProviderContainer } from "@/providers/container";

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: t("title"),
    description: t("description"),
    applicationName: "Swantara",
    icons: {
      icon: "/icon.svg",
      apple: "/icons/apple-touch-icon.png",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: t("title"),
    },
    formatDetection: {
      telephone: false,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export type RootLayoutProps = {
  children: React.ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const locale = await getLocale();
  const messages = await getClientMessages(["Common"]);
  const tCommon = await getTranslations("Common");
  return (
    <html
      lang={locale}
      className={cn("antialiased", interTight.variable, "font-sans")}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        <ThemeScript />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SkipToMain label={tCommon("skipToMain")} />
          <DevtoolWarning />
          <SerwistProvider swUrl="/serwist/sw.js">
            <ProviderContainer>{children}</ProviderContainer>
          </SerwistProvider>
          <ReportWebVitals />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
