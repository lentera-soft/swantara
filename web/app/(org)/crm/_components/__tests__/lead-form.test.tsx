import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithProviders, server } from "@/lib/tests";
import { LeadForm } from "../lead-form";

function useLeadFormHandlers() {
  server.use(
    http.get("*/api/v1/organizations/:organizationId/contacts", () =>
      HttpResponse.json({ success: true, message: "OK.", data: { contacts: [] } }),
    ),
    http.get("*/api/v1/organizations/:organizationId/crm/stages", () =>
      HttpResponse.json({ success: true, message: "OK.", data: { stages: [] } }),
    ),
    http.get("*/api/v1/organizations/:organizationId/crm/teams", () =>
      HttpResponse.json({ success: true, message: "OK.", data: { teams: [] } }),
    ),
  );
}

beforeEach(() => {
  useLeadFormHandlers();
});

describe("LeadForm", () => {
  it("renders the create form", async () => {
    renderWithProviders(<LeadForm orgId="1" />);

    expect(await screen.findByRole("heading", { name: "Prospek baru" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Nama")).toBeInTheDocument();
  });

  it("accepts a lead name through the name field", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LeadForm orgId="1" />);

    const nameInput = await screen.findByPlaceholderText("Nama");
    await user.type(nameInput, "Acme Website Inquiry");

    expect(nameInput).toHaveValue("Acme Website Inquiry");
  });
});

describe("LeadForm salesperson options", () => {
  it("lists only employee contacts as salesperson candidates", async () => {
    server.use(
      http.get("*/api/v1/organizations/:organizationId/contacts", () =>
        HttpResponse.json({
          success: true,
          message: "OK.",
          data: {
            contacts: [
              {
                id: 11,
                organization_id: 1,
                name: "Bu Rina",
                display_name: null,
                is_organization: false,
                parent_id: null,
                email: null,
                phone: null,
                mobile: null,
                website: null,
                tax_id: null,
                industry: null,
                currency_code: null,
                lang: "id",
                active: true,
                is_customer: false,
                is_supplier: false,
                is_employee: true,
                created_at: "2026-01-01T00:00:00Z",
                updated_at: "2026-01-01T00:00:00Z",
              },
              {
                id: 12,
                organization_id: 1,
                name: "Acme Buyer",
                display_name: null,
                is_organization: false,
                parent_id: null,
                email: null,
                phone: null,
                mobile: null,
                website: null,
                tax_id: null,
                industry: null,
                currency_code: null,
                lang: "id",
                active: true,
                is_customer: true,
                is_supplier: false,
                is_employee: false,
                created_at: "2026-01-01T00:00:00Z",
                updated_at: "2026-01-01T00:00:00Z",
              },
            ],
          },
        }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<LeadForm orgId="1" />);

    await screen.findByRole("heading", { name: "Prospek baru" });
    await user.click(screen.getByRole("combobox", { name: "Tenaga penjual" }));

    expect(await screen.findByRole("option", { name: "Bu Rina" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Acme Buyer" })).not.toBeInTheDocument();
  });
});
