import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithProviders, server } from "@/lib/tests";
import { CategoryTableSection } from "../category-table-section";

const STAMP = "2026-01-01T00:00:00Z";

const categories = [
  {
    id: 1,
    name: "Raw Materials",
    parent_id: null,
    income_account_id: null,
    expense_account_id: null,
    stock_cost_account_id: null,
    stock_input_account_id: null,
    stock_output_account_id: null,
    cogs_account_id: null,
    cost_method: null,
    valuation: null,
    created_at: STAMP,
    updated_at: STAMP,
  },
  {
    id: 2,
    name: "Metals",
    parent_id: 1,
    income_account_id: null,
    expense_account_id: null,
    stock_cost_account_id: null,
    stock_input_account_id: null,
    stock_output_account_id: null,
    cogs_account_id: null,
    cost_method: "average",
    valuation: "automated",
    created_at: STAMP,
    updated_at: STAMP,
  },
];

beforeEach(() => {
  server.use(
    http.get("*/api/v1/organizations/:organizationId/item-categories", () =>
      HttpResponse.json({ success: true, message: "OK.", data: { categories } }),
    ),
    http.get("*/api/v1/organizations/:organizationId/accounts", () =>
      HttpResponse.json({
        success: true,
        message: "OK.",
        data: { accounts: [{ id: 10, name: "COGS Expense" }] },
      }),
    ),
  );
});

describe("CategoryTableSection", () => {
  it("renders seeded categories as indented table rows", async () => {
    renderWithProviders(<CategoryTableSection orgId="1" />);

    await screen.findByText("Metals");
    const table = screen.getByRole("table", { name: "Kategori produk" });
    const rows = within(table).getAllByRole("row");
    expect(rows).toHaveLength(3);

    const rootRow = rows[1] as HTMLElement;
    const childRow = rows[2] as HTMLElement;

    expect(within(rootRow).getAllByText("—")).toHaveLength(3);
    expect(within(childRow).getByText("Rata-rata")).toBeInTheDocument();
    expect(within(childRow).getByText("Otomatis")).toBeInTheDocument();
    expect(within(childRow).getByText("Metals")).toHaveStyle({ paddingLeft: "20px" });
    expect(within(rootRow).getByText("Raw Materials")).toHaveStyle({ paddingLeft: "0px" });
  });

  it("opens the create dialog from the add button", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoryTableSection orgId="1" />);

    await screen.findByText("Metals");
    await user.click(screen.getByRole("button", { name: "Tambah kategori" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Kategori baru")).toBeInTheDocument();
  });
});
