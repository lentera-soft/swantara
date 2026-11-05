import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { navigationMock, renderWithProviders, server } from "@/lib/tests";
import { CustomerForm } from "../customer-form";

let lastCreateBody: Record<string, unknown> | null = null;

beforeEach(() => {
  lastCreateBody = null;
  navigationMock.push.mockClear();
  server.use(
    http.get("*/api/v1/organizations/:organizationId/accounts", () =>
      HttpResponse.json({
        success: true,
        message: "OK.",
        data: {
          accounts: [
            { id: 11, code: "1100", name: "Trade Receivables", type: "receivable" },
            { id: 12, code: "5000", name: "COGS", type: "cogs" },
          ],
        },
      }),
    ),
    http.post("*/api/v1/organizations/:organizationId/contacts", async ({ request }) => {
      lastCreateBody = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json({ success: true, message: "OK.", data: { contact: {} } });
    }),
  );
});

describe("CustomerForm", () => {
  it("renders grouped fieldsets for the customer form", async () => {
    renderWithProviders(<CustomerForm orgId="1" />);

    expect(await screen.findByText("Pelanggan baru")).toBeInTheDocument();
    expect(screen.getByText("Identitas")).toBeInTheDocument();
    expect(screen.getByText("Kontak")).toBeInTheDocument();
    expect(screen.getByText("Default pelanggan")).toBeInTheDocument();
    expect(screen.getByText("Pengaturan")).toBeInTheDocument();
  });

  it("requires the customer name before submitting", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CustomerForm orgId="1" />);

    await screen.findByText("Pelanggan baru");
    await user.click(screen.getByRole("button", { name: "Tambah Pelanggan" }));

    expect(await screen.findByText("Nama wajib diisi.")).toBeInTheDocument();
    expect(lastCreateBody).toBeNull();
  });

  it("creates a customer contact and navigates back to the list", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CustomerForm orgId="1" />);

    await screen.findByText("Pelanggan baru");
    await user.type(screen.getByLabelText("Nama *"), "Acme Corp");
    await user.type(screen.getByLabelText("Batas kredit"), "1500");
    await user.click(screen.getByRole("button", { name: "Tambah Pelanggan" }));

    await waitFor(() => expect(navigationMock.push).toHaveBeenCalledWith("/sale-orders/customers"));
    expect(lastCreateBody).toMatchObject({
      name: "Acme Corp",
      customer: { credit_limit: 1500, active: true },
      supplier: null,
    });
  });
});

describe("CustomerForm edit mode", () => {
  const now = "2026-01-05T00:00:00Z";
  let lastUpdateBody: Record<string, unknown> | null = null;

  beforeEach(() => {
    lastUpdateBody = null;
    navigationMock.push.mockClear();
    server.use(
      http.get("*/api/v1/organizations/:organizationId/contacts/:contactId", () =>
        HttpResponse.json({
          success: true,
          message: "OK.",
          data: {
            contact: {
              id: 7,
              organization_id: 1,
              name: "PT Maju Bersama",
              display_name: "Maju Bersama",
              is_organization: true,
              parent_id: null,
              email: "finance@majubersama.co.id",
              phone: "+62215551234",
              mobile: null,
              website: null,
              tax_id: null,
              industry: null,
              currency_code: "IDR",
              lang: "id",
              active: true,
              is_customer: true,
              is_supplier: false,
              created_at: now,
              updated_at: now,
            },
          },
        }),
      ),
      http.get("*/api/v1/organizations/:organizationId/contacts/:contactId/addresses", () =>
        HttpResponse.json({
          success: true,
          message: "OK.",
          data: {
            addresses: [
              {
                id: 31,
                contact_id: 7,
                type: "billing",
                line1: "Jl. Jenderal Sudirman No. 45",
                line2: null,
                city: "Jakarta Selatan",
                state: "DKI Jakarta",
                postal_code: "12190",
                country_code: "ID",
                is_default: true,
                created_at: now,
                updated_at: now,
              },
            ],
          },
        }),
      ),
      http.get("*/api/v1/organizations/:organizationId/contacts/:contactId/bank-accounts", () =>
        HttpResponse.json({
          success: true,
          message: "OK.",
          data: {
            bank_accounts: [
              {
                id: 41,
                contact_id: 7,
                account_holder: "PT Maju Bersama Indonesia",
                bank_name: "Bank Central Asia",
                iban: null,
                swift_bic: "CENAIDJA",
                account_number: "1234567890",
                routing_number: null,
                currency_code: "IDR",
                created_at: now,
                updated_at: now,
              },
            ],
          },
        }),
      ),
      http.get("*/api/v1/organizations/:organizationId/contacts/:contactId/customer", () =>
        HttpResponse.json({
          success: true,
          message: "OK.",
          data: {
            customer: {
              contact_id: 7,
              customer_payment_term_id: null,
              credit_limit: 50000000,
              receivable_account_id: null,
              active: true,
              created_at: now,
              updated_at: now,
            },
          },
        }),
      ),
      http.put(
        "*/api/v1/organizations/:organizationId/contacts/:contactId",
        async ({ request }) => {
          lastUpdateBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({ success: true, message: "OK.", data: { contact: {} } });
        },
      ),
    );
  });

  it("prefills contact, address, bank account, and credit limit", async () => {
    renderWithProviders(<CustomerForm orgId="1" customerId="7" />);

    expect(await screen.findByDisplayValue("Jl. Jenderal Sudirman No. 45")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Bank Central Asia")).toBeInTheDocument();
    expect(screen.getByDisplayValue("50000000")).toBeInTheDocument();
    expect(screen.getByDisplayValue("PT Maju Bersama")).toBeInTheDocument();
  });

  it("adds an address row and saves the nested payload via PUT", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CustomerForm orgId="1" customerId="7" />);

    await screen.findByDisplayValue("Jl. Jenderal Sudirman No. 45");
    await user.click(screen.getByRole("button", { name: "Tambah alamat" }));

    const line1Inputs = screen.getAllByLabelText("Baris alamat 1");
    await user.type(line1Inputs[1]!, "Gedung Business Center");

    await user.type(screen.getByLabelText("Situs web"), "https://majubersama.co.id");

    await user.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(lastUpdateBody).not.toBeNull());
    expect(lastUpdateBody).toMatchObject({
      name: "PT Maju Bersama",
      website: "https://majubersama.co.id",
      customer: { credit_limit: 50000000, active: true },
      addresses: [
        { type: "billing", line1: "Jl. Jenderal Sudirman No. 45", is_default: true },
        { type: "billing", line1: "Gedung Business Center", is_default: false },
      ],
      bank_accounts: [{ bank_name: "Bank Central Asia", account_number: "1234567890" }],
    });
    expect(navigationMock.push).toHaveBeenCalledWith("/sale-orders/customers/7");
  });

  it("rejects two default addresses of the same type", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CustomerForm orgId="1" customerId="7" />);

    await screen.findByDisplayValue("Jl. Jenderal Sudirman No. 45");
    await user.click(screen.getByRole("button", { name: "Tambah alamat" }));

    const line1Inputs = screen.getAllByLabelText("Baris alamat 1");
    await user.type(line1Inputs[1]!, "Cabang Bekasi");

    const defaultSwitches = screen.getAllByRole("switch", { name: "Jadikan bawaan" });
    await user.click(defaultSwitches[1]!);

    await user.click(screen.getByRole("button", { name: "Simpan" }));
    expect(
      await screen.findByText("Hanya satu alamat utama per jenis yang diizinkan."),
    ).toBeInTheDocument();
    expect(lastUpdateBody).toBeNull();
  });
});
