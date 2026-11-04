import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { renderWithProviders, server } from "@/lib/tests";
import { PaymentTermsSection } from "../payment-terms-section";

describe("PaymentTermsSection remainder", () => {
  it("shows the empty state when no terms exist", async () => {
    server.use(
      http.get("*/api/v1/organizations/:organizationId/payment-terms", () =>
        HttpResponse.json({ success: true, message: "OK.", data: { payment_terms: [] } }),
      ),
    );
    renderWithProviders(<PaymentTermsSection orgId="1" />);

    expect(await screen.findByText("Tidak ada syarat pembayaran")).toBeInTheDocument();
  });

  it("shows the error state with retry when loading fails", async () => {
    server.use(
      http.get("*/api/v1/organizations/:organizationId/payment-terms", () =>
        HttpResponse.json({ success: false, message: "Term load failed." }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<PaymentTermsSection orgId="1" />);

    expect(await screen.findByText("Term load failed.")).toBeInTheDocument();

    server.resetHandlers();
    await user.click(screen.getByRole("button", { name: "Coba lagi" }));

    expect(await screen.findByText("Net 30")).toBeInTheDocument();
  });

  it("shows an error toast when deleting fails", async () => {
    server.use(
      http.delete("*/api/v1/organizations/:organizationId/payment-terms/:id", () =>
        HttpResponse.json({ success: false, message: "Cannot delete." }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<PaymentTermsSection orgId="1" />);

    await screen.findByText("Net 30");
    await user.click(screen.getAllByRole("button", { name: "Aksi" })[0]!);
    await user.click(await screen.findByRole("menuitem", { name: "Hapus" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Hapus" }));

    await waitFor(() => expect(screen.getByText("Net 30")).toBeInTheDocument());
  });
});
