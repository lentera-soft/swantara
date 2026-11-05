import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { navigationMock, renderWithProviders, server } from "@/lib/tests";
import { CustomersTable } from "../customers-table-section";

const contacts = [
  {
    id: 1,
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
  },
  {
    id: 2,
    organization_id: 1,
    name: "Globex Corporation",
    display_name: "Globex Inc",
    is_organization: true,
    parent_id: null,
    email: "ops@globex.co",
    phone: null,
    mobile: null,
    website: null,
    tax_id: null,
    industry: null,
    currency_code: "USD",
    lang: "en",
    active: false,
    is_customer: true,
    is_supplier: false,
    created_at: "2026-01-06T00:00:00Z",
    updated_at: "2026-01-06T00:00:00Z",
  },
  {
    id: 3,
    organization_id: 1,
    name: "Supplier Only",
    display_name: "Supplier Only",
    is_organization: true,
    parent_id: null,
    email: null,
    phone: null,
    mobile: null,
    website: null,
    tax_id: null,
    industry: null,
    currency_code: "USD",
    lang: "en",
    active: true,
    is_customer: false,
    is_supplier: true,
    created_at: "2026-01-07T00:00:00Z",
    updated_at: "2026-01-07T00:00:00Z",
  },
];

beforeEach(() => {
  const list = [...contacts];
  server.use(
    http.get("*/api/v1/organizations/:organizationId/contacts", () =>
      HttpResponse.json({ success: true, message: "OK.", data: { contacts: list } }),
    ),
    http.delete("*/api/v1/organizations/:organizationId/contacts/:contactId", ({ params }) => {
      const index = list.findIndex((contact) => String(contact.id) === String(params.contactId));
      if (index >= 0) list.splice(index, 1);
      return HttpResponse.json({ success: true, message: "OK.", data: null });
    }),
  );
});

describe("CustomersTable", () => {
  it("renders seeded customers", async () => {
    renderWithProviders(<CustomersTable />);

    expect(await screen.findByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Globex Inc")).toBeInTheDocument();
  });

  it("excludes contacts that are only suppliers", async () => {
    renderWithProviders(<CustomersTable />);

    await screen.findByText("Acme Corp");
    expect(screen.queryByText("Supplier Only")).not.toBeInTheDocument();
  });

  it("links to the create page from the add button", async () => {
    renderWithProviders(<CustomersTable />);

    await screen.findByText("Acme Corp");
    const link = screen.getByRole("link", { name: /Tambah Pelanggan/ });
    expect(link).toHaveAttribute("href", "/sale-orders/customers/new");
  });

  it("shows phone, website, industry and tax id columns", async () => {
    renderWithProviders(<CustomersTable />);

    await screen.findByText("Acme Corp");
    expect(screen.getByText("021-555-0100")).toBeInTheDocument();
    expect(screen.getByText("acme.co")).toBeInTheDocument();
    expect(screen.getByText("Manufacturing")).toBeInTheDocument();
    expect(screen.getByText("01.234.567.8-901.000")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("renders edit, quote and delete row actions", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CustomersTable />);

    await screen.findByText("Acme Corp");
    expect(screen.getAllByRole("button", { name: "Aksi" })).toHaveLength(2);

    await user.click(screen.getAllByRole("button", { name: "Aksi" })[0]!);
    expect(await screen.findByRole("menuitem", { name: "Ubah pelanggan" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Penawaran baru" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Hapus pelanggan" })).toBeInTheDocument();
  });

  it("navigates to the edit page from the row actions menu", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CustomersTable />);

    await screen.findByText("Acme Corp");
    await user.click(screen.getAllByRole("button", { name: "Aksi" })[0]!);
    await user.click(await screen.findByRole("menuitem", { name: "Ubah pelanggan" }));

    await waitFor(() =>
      expect(navigationMock.push).toHaveBeenCalledWith("/sale-orders/customers/1/edit"),
    );
  });

  it("deletes a customer after confirmation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CustomersTable />);

    await screen.findByText("Acme Corp");
    await user.click(screen.getAllByRole("button", { name: "Aksi" })[0]!);
    await user.click(await screen.findByRole("menuitem", { name: "Hapus pelanggan" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Hapus pelanggan ini?")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Hapus" }));

    await waitFor(() => expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument());
  });
});
