import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { OrgActiveProvider } from "@/providers/org-active-provider";
import { useActiveOrg, useActiveOrgCurrency, useOrganizationId } from "../use-org-context";

vi.mock("@/lib/hooks/use-me-query", () => ({
  useMeOrganizationsQuery: vi.fn(() => ({
    data: {
      organizations: [
        { id: 11, name: "Acme", baseCurrency: "USD" },
        { id: 12, name: "Nusantara" },
      ],
    },
  })),
}));

function renderOrgHook<Result>(hook: () => Result, orgId: number | null) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Number.POSITIVE_INFINITY } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {orgId == null ? children : <OrgActiveProvider orgId={orgId}>{children}</OrgActiveProvider>}
      </QueryClientProvider>
    );
  }
  return renderHook(hook, { wrapper: Wrapper });
}

describe("org context hooks", () => {
  it("exposes the active organization from the provider", () => {
    const { result } = renderOrgHook(
      () => ({
        activeOrg: useActiveOrg(),
        organizationId: useOrganizationId(),
      }),
      11,
    );

    expect(result.current).toEqual({
      activeOrg: { id: 11 },
      organizationId: 11,
    });
  });

  it("returns null when no organization is active", () => {
    const { result } = renderOrgHook(
      () => ({
        activeOrg: useActiveOrg(),
        organizationId: useOrganizationId(),
      }),
      null,
    );

    expect(result.current).toEqual({ activeOrg: null, organizationId: null });
  });

  it("returns the active organization base currency", () => {
    const { result } = renderOrgHook(() => useActiveOrgCurrency(), 11);
    expect(result.current).toBe("USD");
  });

  it("falls back to the default currency when the organization has none", () => {
    const { result } = renderOrgHook(() => useActiveOrgCurrency(), 12);
    expect(result.current).toBe("IDR");
  });
});
