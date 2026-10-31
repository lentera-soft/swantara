import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { InvoiceSummary } from "@/lib/services/swantara";
import { renderWithProviders } from "@/lib/tests";
import { DeductDepositDialog } from "../deduct-deposit-dialog";

const invoices = [
  {
    id: 1,
    type: "customer_invoice",
    contactId: 7,
    name: "ADV-1",
    reference: "SO-1",
    state: "posted",
    paymentState: "not_paid",
    isAdvance: true,
    amountUntaxed: 100,
    amountTax: 0,
    amountTotal: 100,
    amountResidual: 100,
    invoiceDate: null,
  },
  {
    id: 2,
    type: "customer_invoice",
    contactId: 7,
    name: "INV-2",
    reference: "SO-1",
    state: "posted",
    paymentState: "not_paid",
    isAdvance: false,
    amountUntaxed: 200,
    amountTax: 0,
    amountTotal: 200,
    amountResidual: 200,
    invoiceDate: null,
  },
] as InvoiceSummary[];

function renderDialog() {
  return renderWithProviders(
    <DeductDepositDialog
      title="Deduct deposit"
      confirmLabel="Deduct"
      open
      onOpenChange={() => {}}
      onConfirm={vi.fn()}
      invoices={invoices}
    />,
  );
}

describe("DeductDepositDialog", () => {
  it("lists only advance invoices as the deposit source", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("combobox", { name: "Faktur uang muka" }));

    expect(await screen.findByRole("option", { name: /ADV-1/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /INV-2/ })).not.toBeInTheDocument();
  });

  it("lists only final invoices as the deposit target", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("combobox", { name: "Faktur akhir" }));

    expect(await screen.findByRole("option", { name: /INV-2/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /ADV-1/ })).not.toBeInTheDocument();
  });
});
