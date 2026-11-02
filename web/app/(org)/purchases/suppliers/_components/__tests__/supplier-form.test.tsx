import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { navigationMock, renderWithProviders, server } from "@/lib/tests";
import { SupplierForm } from "../supplier-form";

let lastCreateBody: Record<string, unknown> | null = null;

beforeEach(() => {
  lastCreateBody = null;
  navigationMock.push.mockClear();
  server.use(
    http.get("*/api/v1/currencies", () =>
      HttpResponse.json({
        success: true,
        message: "OK.",
        data: { currencies: [{ code: "USD", name: "US Dollar" }] },
      }),
    ),
    http.post("*/api/v1/organizations/:organizationId/contacts", async ({ request }) => {
      lastCreateBody = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json({ success: true, message: "OK.", data: { contact: {} } });
    }),
  );
});

describe("SupplierForm", () => {
  it("renders grouped fieldsets for the supplier form", async () => {
    renderWithProviders(<SupplierForm orgId="1" />);

    expect(await screen.findByText("Pemasok baru")).toBeInTheDocument();
    expect(screen.getByText("Identitas")).toBeInTheDocument();
    expect(screen.getByText("Kontak")).toBeInTheDocument();
    expect(screen.getByText("Pengaturan")).toBeInTheDocument();
  });

  it("requires the supplier name before submitting", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SupplierForm orgId="1" />);

    await screen.findByText("Pemasok baru");
    await user.click(screen.getByRole("button", { name: "Tambah Pemasok" }));

    expect(await screen.findByText("Masukkan nama.")).toBeInTheDocument();
    expect(lastCreateBody).toBeNull();
  });

  it("creates a supplier contact and navigates back to the list", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SupplierForm orgId="1" />);

    await screen.findByText("Pemasok baru");
    await user.type(screen.getByLabelText("Nama"), "Acme Corp");
    await user.click(screen.getByRole("button", { name: "Tambah Pemasok" }));

    await waitFor(() => expect(navigationMock.push).toHaveBeenCalledWith("/purchases/suppliers"));
    expect(lastCreateBody).toMatchObject({
      name: "Acme Corp",
      supplier: { active: true },
    });
  });
});
