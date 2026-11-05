import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MarketingFooter } from "@/app/(marketing)/_components/marketing-footer";
import CareersPage, {
  generateMetadata as generateCareersMetadata,
} from "@/app/(marketing)/careers/page";
import ChangelogPage, {
  generateMetadata as generateChangelogMetadata,
} from "@/app/(marketing)/changelog/page";
import DpaPage, { generateMetadata as generateDpaMetadata } from "@/app/(marketing)/dpa/page";
import FeaturesPage, {
  generateMetadata as generateFeaturesMetadata,
} from "@/app/(marketing)/features/page";
import GuidesPage, {
  generateMetadata as generateGuidesMetadata,
} from "@/app/(marketing)/guides/page";
import PrivacyPage, {
  generateMetadata as generatePrivacyMetadata,
} from "@/app/(marketing)/privacy/page";
import SecurityPage, {
  generateMetadata as generateSecurityMetadata,
} from "@/app/(marketing)/security/page";
import SupportPage, {
  generateMetadata as generateSupportMetadata,
} from "@/app/(marketing)/support/page";
import TermsPage, { generateMetadata as generateTermsMetadata } from "@/app/(marketing)/terms/page";
import { renderWithProviders } from "@/lib/tests";

vi.mock("next-intl/server", async () => {
  const loaded = (await import("@/messages/id.json")) as unknown as Record<string, unknown>;
  const messages: Record<string, unknown> =
    (loaded as { default?: Record<string, unknown> }).default ?? loaded;

  function resolveNamespace(namespace: string): Record<string, string> {
    const parts = namespace.split(".");
    let cursor: unknown = messages;
    for (const part of parts) {
      if (cursor && typeof cursor === "object" && part in (cursor as Record<string, unknown>)) {
        cursor = (cursor as Record<string, unknown>)[part];
      } else {
        throw new Error(`Missing messages namespace: ${namespace}`);
      }
    }
    return cursor as Record<string, string>;
  }

  return {
    getLocale: async () => "id",
    getMessages: async () => messages,
    getTranslations: async (namespace: string) => {
      const ns = resolveNamespace(namespace);
      return (key: string) => ns[key] ?? key;
    },
  };
});

describe("Marketing sitemap pages", () => {
  it("renders the features page with the capability matrix", () => {
    renderWithProviders(<FeaturesPage />);

    expect(
      screen.getByRole("heading", { name: /satu sistem\.[\s\S]*kemampuan tanpa batas/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Pipeline menyatu")).toBeInTheDocument();
    expect(screen.getByText("Dasbor langsung")).toBeInTheDocument();
  });

  it("renders the security page pillars and commitments", () => {
    renderWithProviders(<SecurityPage />);

    expect(
      screen.getByRole("heading", { name: /keamanan yang tidak[\s\S]*perlu anda pikirkan/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Terenkripsi dari ujung ke ujung")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /email tim keamanan/i })).toHaveAttribute(
      "href",
      "mailto:security@swantara.com",
    );
  });

  it("renders the careers page with open roles linking to contact", () => {
    renderWithProviders(<CareersPage />);

    expect(
      screen.getByRole("heading", {
        name: /bangun perangkat lunak tenang[\s\S]*bersama tim kecil/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /product engineer/i })).toHaveAttribute(
      "href",
      "/contact",
    );
  });

  it("renders the guides page collections and topics", () => {
    renderWithProviders(<GuidesPage />);

    expect(
      screen.getByRole("heading", { name: /panduan untuk tim[\s\S]*yang bergerak/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Tutup akhir bulan")).toBeInTheDocument();
    expect(screen.getByText("12 menit")).toBeInTheDocument();
  });

  it("renders the changelog page releases in order", () => {
    renderWithProviders(<ChangelogPage />);

    expect(
      screen.getByRole("heading", { name: /langkah kecil[\s\S]*dikirim setiap minggu/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("v2.6")).toBeInTheDocument();
    expect(screen.getByText("Run payroll berjalan otomatis")).toBeInTheDocument();
  });

  it("toggles the support page FAQ accordion", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SupportPage />);

    expect(
      screen.getByRole("heading", { name: /bantuan dari manusia[\s\S]*bukan antrean/i }),
    ).toBeInTheDocument();

    const collapsedFaq = screen.getByRole("button", { name: /bisakah data lama diimpor/i });
    expect(collapsedFaq).toHaveAttribute("aria-expanded", "false");
    await user.click(collapsedFaq);
    expect(collapsedFaq).toHaveAttribute("aria-expanded", "true");
  });

  it("renders the privacy policy with its seven numbered sections", () => {
    renderWithProviders(<PrivacyPage />);

    expect(
      screen.getByRole("heading", { name: /kebijakan privasi/i, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /siapa kami/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /hak anda/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /privacy@swantara\.com/i })).toHaveAttribute(
      "href",
      "mailto:privacy@swantara.com",
    );
  });

  it("renders the terms of service with numbered sections", () => {
    renderWithProviders(<TermsPage />);

    expect(
      screen.getByRole("heading", { name: /ketentuan layanan/i, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /tanggung jawab/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /pengakhiran dan perubahan/i })).toBeInTheDocument();
  });

  it("renders the DPA and links to related documents", () => {
    renderWithProviders(<DpaPage />);

    expect(
      screen.getByRole("heading", { name: /perjanjian pemrosesan data/i, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /transfer lintas negara/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /privasi/i })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: /ketentuan/i })).toHaveAttribute("href", "/terms");
  });

  it("generates metadata for all new marketing routes", async () => {
    const metas = await Promise.all([
      generateFeaturesMetadata(),
      generateSecurityMetadata(),
      generateCareersMetadata(),
      generateGuidesMetadata(),
      generateChangelogMetadata(),
      generateSupportMetadata(),
      generatePrivacyMetadata(),
      generateTermsMetadata(),
      generateDpaMetadata(),
    ]);

    for (const meta of metas) {
      expect(meta.title).toContain("Swantara");
    }
  });

  it("points the footer sitemap at the dedicated pages", () => {
    renderWithProviders(<MarketingFooter />);

    const footer = screen.getByRole("contentinfo");
    const expected: Record<string, string> = {
      Fitur: "/features",
      Keamanan: "/security",
      Karier: "/careers",
      Panduan: "/guides",
      Perubahan: "/changelog",
      Dukungan: "/support",
      Privasi: "/privacy",
      Ketentuan: "/terms",
      DPA: "/dpa",
    };

    for (const [label, href] of Object.entries(expected)) {
      expect(within(footer).getByRole("link", { name: label })).toHaveAttribute("href", href);
    }
  });
});
