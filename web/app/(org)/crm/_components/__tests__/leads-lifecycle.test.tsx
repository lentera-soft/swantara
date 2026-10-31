import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithProviders, server } from "@/lib/tests";
import { LeadsSection } from "../leads-section";

const lead = {
  id: 1,
  organization_id: 1,
  name: "Acme Website Inquiry",
  type: "prospect",
  status: "new",
  contact_id: null,
  contact_name: "Aria Chen",
  email: "aria@example.com",
  phone: null,
  job_position: null,
  stage_id: 1,
  expected_revenue: 5000,
  probability: 10,
  priority: 1,
  salesperson_id: null,
  sales_group_id: null,
  source: "website",
  medium: null,
  campaign: null,
  lost_reason: null,
  expected_close: null,
  closed_at: null,
  is_won: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const stages = [{ id: 1, name: "New", sequence: 1, is_won: false, probability: 10 }];

beforeEach(() => {
  server.use(
    http.get("*/api/v1/organizations/:organizationId/crm/leads", () =>
      HttpResponse.json({ success: true, message: "OK.", data: { leads: [lead] } }),
    ),
    http.get("*/api/v1/organizations/:organizationId/crm/stages", () =>
      HttpResponse.json({ success: true, message: "OK.", data: { stages } }),
    ),
    http.get("*/api/v1/organizations/:organizationId/contacts", () =>
      HttpResponse.json({ success: true, message: "OK.", data: { contacts: [] } }),
    ),
    http.get("*/api/v1/organizations/:organizationId/crm/teams", () =>
      HttpResponse.json({ success: true, message: "OK.", data: { teams: [] } }),
    ),
  );
});

describe("LeadsSection lifecycle actions", () => {
  it("marks a new lead as contacted", async () => {
    let body: Record<string, unknown> | undefined;
    server.use(
      http.post(
        "*/api/v1/organizations/:organizationId/crm/leads/:id/status",
        async ({ request }) => {
          body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            success: true,
            message: "OK.",
            data: { prospect: { ...lead, status: "contacted" } },
          });
        },
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<LeadsSection orgId="1" />);

    await screen.findByText("Acme Website Inquiry");
    await user.click(screen.getByRole("button", { name: "Tandai dihubungi" }));

    await waitFor(() => expect(body).toEqual({ status: "contacted" }));
  });

  it("requires a reason before disqualifying a lead", async () => {
    let body: Record<string, unknown> | undefined;
    server.use(
      http.post(
        "*/api/v1/organizations/:organizationId/crm/leads/:id/status",
        async ({ request }) => {
          body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            success: true,
            message: "OK.",
            data: { prospect: { ...lead, status: "disqualified" } },
          });
        },
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<LeadsSection orgId="1" />);

    await screen.findByText("Acme Website Inquiry");
    await user.click(screen.getByRole("button", { name: "Diskualifikasi" }));

    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Alasan kalah"), "No budget");
    await user.click(within(dialog).getByRole("button", { name: "Diskualifikasi" }));

    await waitFor(() =>
      expect(body).toEqual({
        status: "disqualified",
        reason: "No budget",
        lost_reason_code: null,
      }),
    );
  });
});
