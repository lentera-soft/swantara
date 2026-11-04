import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { navigationMock, renderWithProviders } from "@/lib/tests";
import { PaymentTermsSection } from "../payment-terms-section";

describe("PaymentTermsSection", () => {
  it("renders the seeded payment terms", async () => {
    renderWithProviders(<PaymentTermsSection orgId="1" />);

    expect(await screen.findByText("Net 30")).toBeInTheDocument();
    expect(screen.getByText("50/50 split")).toBeInTheDocument();
  });

  it("shows the number of schedule lines per term", async () => {
    renderWithProviders(<PaymentTermsSection orgId="1" />);

    const net30Row = (await screen.findByText("Net 30")).closest("tr");
    expect(within(net30Row!).getByText("1")).toBeInTheDocument();

    const splitRow = screen.getByText("50/50 split").closest("tr");
    expect(within(splitRow!).getByText("2")).toBeInTheDocument();
  });

  it("links the add button to the new term page", async () => {
    renderWithProviders(<PaymentTermsSection orgId="1" />);

    const link = await screen.findByRole("link", { name: "Tambah syarat" });
    expect(link).toHaveAttribute("href", "/reference/payment-terms/new");
  });

  it("navigates to the term page when editing a row", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PaymentTermsSection orgId="1" />);

    await screen.findByText("Net 30");
    await user.click(screen.getAllByRole("button", { name: "Aksi" })[0]!);
    await user.click(await screen.findByRole("menuitem", { name: "Ubah" }));

    await waitFor(() =>
      expect(navigationMock.push).toHaveBeenCalledWith("/reference/payment-terms/1"),
    );
  });

  it("deletes a payment term after confirmation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PaymentTermsSection orgId="1" />);

    await screen.findByText("Net 30");
    await user.click(screen.getAllByRole("button", { name: "Aksi" })[0]!);
    await user.click(await screen.findByRole("menuitem", { name: "Hapus" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Hapus" }));

    await waitFor(() => expect(screen.queryByText("Net 30")).not.toBeInTheDocument());
  });
});
