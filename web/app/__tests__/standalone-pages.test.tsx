import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OrgProfilePage from "@/app/(org)/profile/page";
import CompanySettingsPage from "@/app/(org)/settings/page";
import GlobalErrorPreviewPage from "@/app/global-error";
import LicensesPage from "@/app/licenses/page";
import NotFound from "@/app/not-found";
import { renderWithProviders } from "@/lib/tests";

vi.mock("next-intl/server", async () => {
  const loaded = (await import("@/messages/id.json")) as unknown as Record<
    string,
    Record<string, string>
  >;
  const messages: Record<string, Record<string, string>> = (
    loaded as { default?: Record<string, Record<string, string>> }
  ).default ?? loaded;
  return {
    getTranslations: async (namespace: string) => {
      const ns = messages[namespace];
      if (!ns) {
        throw new Error(`Missing messages namespace: ${namespace}`);
      }
      return (key: string, values?: Record<string, string | number>) => {
        const message = ns[key];
        if (message === undefined) {
          throw new Error(`Missing message: ${namespace}.${key}`);
        }
        if (!values) return message;
        return message.replace(/\{(\w+)\}/g, (match, name: string) =>
          values[name] !== undefined ? String(values[name]) : match,
        );
      };
    },
  };
});

describe("standalone pages", () => {
  it("renders the org settings page", async () => {
    const element = await CompanySettingsPage();
    renderWithProviders(element);
  });

  it("renders the profile settings page", () => {
    renderWithProviders(<OrgProfilePage />);
  });

  it("renders the global error preview with a reset action", () => {
    renderWithProviders(
      <GlobalErrorPreviewPage error={new Error("Preview error")} reset={() => {}} />,
    );

    expect(screen.getByRole("button", { name: /coba lagi/i })).toBeInTheDocument();
  });

  it("renders the licenses page", async () => {
    const element = await LicensesPage();
    renderWithProviders(element);

    expect(screen.getByRole("heading", { name: /lisensi pihak ketiga/i })).toBeInTheDocument();
  });

  it("renders the not-found page with a link home", async () => {
    const element = await NotFound();
    renderWithProviders(element);

    expect(screen.getByRole("heading", { name: /halaman tidak ditemukan/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /kembali ke beranda/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });
});
