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
