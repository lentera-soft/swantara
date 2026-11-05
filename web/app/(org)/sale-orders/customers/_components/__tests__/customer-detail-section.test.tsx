import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithProviders, server } from "@/lib/tests";
import { CustomerDetail } from "../customer-detail-section";

const contact = {
  id: 7,
  organization_id: 1,
  name: "Acme Corporation",
  display_name: "Acme Corp",
  is_organization: true,
  parent_id: null,
  email: "hello@acme.co",
  phone: "021-555-0100",
  mobile: null,
  website: "acme.co",
  tax_id: "01.234.567.8-901.000",
  industry: "Manufacturing",
  currency_code: "USD",
  lang: "en",
  active: true,
  is_customer: true,
  is_supplier: false,
  created_at: "2026-01-05T00:00:00Z",
  updated_at: "2026-01-05T00:00:00Z",
};

const orders = [
  {
    id: 11,
    organization_id: 1,
    name: "SO/2026/0001",
    contact_id: 7,
    state: "confirmed",
    order_date: "2026-02-10T00:00:00Z",
    amount_untaxed: 1000,
    amount_tax: 110,
    amount_total: 1110,
    invoice_status: "to_invoice",
    delivery_status: "pending",
    created_at: "2026-02-10T00:00:00Z",
    updated_at: "2026-02-10T00:00:00Z",
  },
];

beforeEach(() => {
  server.use(
    http.get("*/api/v1/organizations/:organizationId/contacts/:contactId", () =>
      HttpResponse.json({ success: true, message: "OK.", data: { contact } }),
    ),
    http.get("*/api/v1/organizations/:organizationId/sale-orders", () =>
      HttpResponse.json({ success: true, message: "OK.", data: { orders } }),
    ),
  );
});

describe("CustomerDetail", () => {
  it("renders the record layout with all tabs", async () => {
    renderWithProviders(<CustomerDetail orgId="1" customerId="7" />);

    expect(await screen.findByRole("heading", { name: "Acme Corp" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Ringkasan" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Pesanan" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Alamat" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Rekening bank" })).toBeInTheDocument();
  });

  it("shows customer identity details on the overview tab", async () => {
    renderWithProviders(<CustomerDetail orgId="1" customerId="7" />);

    const overview = await screen.findAllByText("Acme Corporation");
    expect(overview.length).toBeGreaterThan(0);
    expect(screen.getByText("hello@acme.co")).toBeInTheDocument();
    expect(screen.getByText("01.234.567.8-901.000")).toBeInTheDocument();
  });

  it("lists sale orders on the orders tab", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CustomerDetail orgId="1" customerId="7" />);

    await screen.findByRole("heading", { name: "Acme Corp" });
    await user.click(screen.getByRole("tab", { name: "Pesanan" }));

    const table = await screen.findByRole("table");
    expect(within(table).getByText("SO/2026/0001")).toBeInTheDocument();
    expect(within(table).getByText("Pesanan dikonfirmasi")).toBeInTheDocument();
  });

  it("links orders to their detail page", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CustomerDetail orgId="1" customerId="7" />);

    await screen.findByRole("heading", { name: "Acme Corp" });
    await user.click(screen.getByRole("tab", { name: "Pesanan" }));

    const link = await screen.findByRole("link", { name: "SO/2026/0001" });
    expect(link).toHaveAttribute("href", "/sale-orders/11");
  });

  it("shows not found when the contact is missing", async () => {
    server.use(
      http.get("*/api/v1/organizations/:organizationId/contacts/:contactId", () =>
        HttpResponse.json(
          { success: false, message: "Nope.", error: { code: "not_found" } },
          { status: 404 },
        ),
      ),
    );

    renderWithProviders(<CustomerDetail orgId="1" customerId="999" />);

    expect(await screen.findByText("Pelanggan tidak ditemukan.")).toBeInTheDocument();
  });

  it("shows not found when the contact is not a customer", async () => {
    server.use(
      http.get("*/api/v1/organizations/:organizationId/contacts/:contactId", () =>
        HttpResponse.json({
          success: true,
          message: "OK.",
          data: { contact: { ...contact, is_customer: false } },
        }),
      ),
    );

    renderWithProviders(<CustomerDetail orgId="1" customerId="7" />);

    expect(await screen.findByText("Pelanggan tidak ditemukan.")).toBeInTheDocument();
  });

  it("uploads a new customer photo", async () => {
    let avatarPatched = false;
    let contactLoads = 0;
    server.use(
      http.get("*/api/v1/organizations/:organizationId/contacts/:contactId", () => {
        contactLoads += 1;
        return HttpResponse.json({ success: true, message: "OK.", data: { contact } });
      }),
      http.patch("*/api/v1/organizations/:organizationId/contacts/:contactId/avatar", () => {
        avatarPatched = true;
        return HttpResponse.json({ success: true, message: "OK.", data: { avatar: "obj-1" } });
      }),
    );

    renderWithProviders(<CustomerDetail orgId="1" customerId="7" />);

    await screen.findByRole("heading", { name: "Acme Corp" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    fireEvent.change(fileInput, {
      target: { files: [new File(["fake"], "photo.png", { type: "image/png" })] },
    });

    await waitFor(() => expect(avatarPatched).toBe(true));
    await waitFor(() => expect(contactLoads).toBeGreaterThan(1));
  });
});
