import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AboutPage, { generateMetadata as generateAboutMetadata } from "@/app/(marketing)/about/page";
import ContactPage, {
  generateMetadata as generateContactMetadata,
} from "@/app/(marketing)/contact/page";
import MarketingLayout from "@/app/(marketing)/layout";
import MarketingHomePage, {
  generateMetadata as generateHomeMetadata,
} from "@/app/(marketing)/page";
import PricingPage, {
  generateMetadata as generatePricingMetadata,
} from "@/app/(marketing)/pricing/page";
import ProductPage, {
  generateMetadata as generateProductMetadata,
} from "@/app/(marketing)/product/page";
import { submitContactInquiry } from "@/lib/services/contact-inquiry";
import { renderWithProviders } from "@/lib/tests";

vi.mock("@/lib/services/contact-inquiry", () => ({
  submitContactInquiry: vi.fn(async () => {}),
}));

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

describe("Marketing Swiss Design Pages", () => {
  it("renders the marketing layout with header, main landmark, and footer", async () => {
    const user = userEvent.setup();
    const element = await MarketingLayout({
      children: <MarketingHomePage />,
    });
    renderWithProviders(element);

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /jalankan seluruh bisnis anda[\s\S]*dari satu tempat yang tenang/i,
      }),
    ).toBeInTheDocument();

    const openMenuButton = screen.getByRole("button", { name: /buka menu/i });
    await user.click(openMenuButton);
    expect(screen.getByRole("button", { name: /tutup menu/i })).toBeInTheDocument();
  });

  it("switches active ERP telemetry metrics and toggles FAQ items on the home page", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MarketingHomePage />);

    const cashMetricButton = screen.getByRole("button", { name: /kas/i });
    await user.click(cashMetricButton);
    expect(cashMetricButton).toHaveAttribute("aria-pressed", "true");

    const faqButton = screen.getByRole("button", {
      name: /bisakah saya hanya memakai modul yang dibutuhkan/i,
    });
    await user.click(faqButton);
    expect(faqButton).toHaveAttribute("aria-expanded", "true");
  });

  it("renders the product page with all five operating rhythm modules", () => {
    renderWithProviders(<ProductPage />);

    expect(
      screen.getByRole("heading", { name: /satu platform\.[\s\S]*setiap ritme operasional/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /ubah percakapan menjadi pendapatan berulang/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /pembukuan yang mengikuti bisnis/i }),
    ).toBeInTheDocument();
  });

  it("toggles monthly and annual billing cadences on the pricing page", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PricingPage />);

    expect(screen.getByText("Rp449rb")).toBeInTheDocument();

    const monthlyButton = screen.getByRole("button", { name: /bulanan/i });
    await user.click(monthlyButton);
    expect(monthlyButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Rp549rb")).toBeInTheDocument();
  });

  it("renders the about page story, principles, and leadership team", () => {
    renderWithProviders(<AboutPage />);

    expect(
      screen.getByRole("heading", {
        name: /kami membangun perangkat lunak tenang[\s\S]*untuk tim ambisius/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ariana Putri")).toBeInTheDocument();
    expect(screen.getByText("Dimas Prakoso")).toBeInTheDocument();
  });

  it("submits the contact inquiry form and handles success and error states", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContactPage />);

    await user.type(screen.getByLabelText(/nama/i), "Budi Santoso");
    await user.type(screen.getByLabelText(/email kerja/i), "budi@example.com");
    await user.type(screen.getByLabelText(/perusahaan/i), "PT Nusantara");
    await user.type(
      screen.getByLabelText(/ada yang bisa kami bantu/i),
      "Kami tertarik menjadwalkan demo ERP.",
    );

    await user.click(screen.getByRole("button", { name: /kirim pesan/i }));

    await waitFor(() => {
      expect(submitContactInquiry).toHaveBeenCalledWith({
        name: "Budi Santoso",
        email: "budi@example.com",
        company: "PT Nusantara",
        message: "Kami tertarik menjadwalkan demo ERP.",
      });
    });

    expect(await screen.findByRole("status")).toBeInTheDocument();

    vi.mocked(submitContactInquiry).mockRejectedValueOnce(new Error("Network error"));
    await user.type(screen.getByLabelText(/nama/i), "Budi Santoso");
    await user.type(screen.getByLabelText(/email kerja/i), "budi@example.com");
    await user.type(screen.getByLabelText(/ada yang bisa kami bantu/i), "Pesan kedua");
    await user.click(screen.getByRole("button", { name: /kirim pesan/i }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("generates metadata for all marketing routes", async () => {
    const [homeMeta, productMeta, pricingMeta, aboutMeta, contactMeta] = await Promise.all([
      generateHomeMetadata(),
      generateProductMetadata(),
      generatePricingMetadata(),
      generateAboutMetadata(),
      generateContactMetadata(),
    ]);

    expect(homeMeta.title).toContain("Swantara");
    expect(productMeta.title).toContain("Swantara");
    expect(pricingMeta.title).toContain("Swantara");
    expect(aboutMeta.title).toContain("Swantara");
    expect(contactMeta.title).toContain("Swantara");
  });
});
