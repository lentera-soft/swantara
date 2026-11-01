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
