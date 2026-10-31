import { type DehydratedState, HydrationBoundary } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { CommandPaletteProvider } from "@/components/command-palette";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { prefetchMeData, prefetchPermissionsData } from "@/lib/server/prefetch";
import { OrgActiveProvider } from "@/providers/org-active-provider";
import { SessionProvider } from "@/providers/session";
import { TanstackQueryProvider } from "@/providers/tanstack-query";
import { OrgShell } from "./_components/org-shell";

export default async function OrganizationLayout({ children }: { children: ReactNode }) {
  const organizationId = await requireActiveOrgId();
  const locale = await getLocale();
  const messages = await getMessages();
  const [meState, permissionsState] = await Promise.allSettled([
    prefetchMeData(),
    prefetchPermissionsData(organizationId),
  ]);
  const queries = [
    ...(meState.status === "fulfilled" ? meState.value.queries : []),
    ...(permissionsState.status === "fulfilled" ? permissionsState.value.queries : []),
  ];
  const dehydratedState: DehydratedState = { queries, mutations: [] };

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <TanstackQueryProvider>
        <HydrationBoundary state={dehydratedState}>
          <SessionProvider>
            <CommandPaletteProvider>
              <OrgActiveProvider orgId={organizationId}>
                <Suspense fallback={null}>
                  <OrgShell>{children}</OrgShell>
                </Suspense>
              </OrgActiveProvider>
            </CommandPaletteProvider>
          </SessionProvider>
        </HydrationBoundary>
      </TanstackQueryProvider>
    </NextIntlClientProvider>
  );
}
