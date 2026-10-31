import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithProviders, server } from "@/lib/tests";
import { CrmRecordDetail } from "../crm-record-detail";

const lead = {
  id: 1,
  organization_id: 1,
  name: "Acme Website Inquiry",
  type: "prospect",
  status: "qualified",
  temperature: "warm",
  contact_id: 5,
  contact_name: "Aria Chen",
  email: "aria@example.com",
  phone: "555-0100",
  job_position: "Buyer",
  need_summary: "Needs a faster onboarding workflow",
  stage_id: 1,
  expected_revenue: 5000,
  currency_code: "IDR",
  probability: 30,
  forecast_category: "pipeline",
  priority: 1,
  salesperson_id: null,
  sales_group_id: null,
  owner_user_id: 2,
  source: "website",
  medium: "email",
  campaign: "spring",
  budget_amount: null,
  budget_confirmed: false,
  authority_confirmed: false,
  timeline_date: null,
  fit_score: 0,
  intent_score: 0,
  lead_score: 0,
  qualification_notes: null,
  decision_criteria: null,
  competition: null,
  proposed_solution: null,
  next_step: "Send proposal",
  next_step_due: "2026-02-01",
  consent_granted: true,
  consent_source: null,
  consent_at: null,
  do_not_contact: false,
  first_contacted_at: "2026-01-02T00:00:00Z",
  qualified_at: "2026-01-03T00:00:00Z",
  converted_at: null,
  stage_entered_at: "2026-01-03T00:00:00Z",
  last_activity_at: "2026-01-04T00:00:00Z",
  lost_reason: null,
  lost_reason_code: null,
  expected_close: "2026-03-01",
  closed_at: null,
  is_won: false,
  is_lost: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-04T00:00:00Z",
};

const activity = {
  id: 10,
  prospect_id: 1,
  contact_id: null,
  type: "call",
  summary: "Discovery call",
  note: "Discussed onboarding",
  outcome: "connected",
  next_step: null,
  next_step_due: null,
  participants: null,
  due_date: null,
  done: true,
  done_at: "2026-01-04T00:00:00Z",
  user_id: 2,
  created_at: "2026-01-04T00:00:00Z",
  updated_at: "2026-01-04T00:00:00Z",
};

beforeEach(() => {
  server.use(
    http.get("*/api/v1/organizations/:organizationId/crm/leads/1", () =>
      HttpResponse.json({ success: true, message: "OK.", data: { prospect: lead } }),
    ),
    http.get("*/api/v1/organizations/:organizationId/crm/stages", () =>
      HttpResponse.json({
        success: true,
        message: "OK.",
        data: {
          stages: [{ id: 1, name: "Qualified", sequence: 1, is_won: false, probability: 30 }],
        },
      }),
    ),
    http.get("*/api/v1/organizations/:organizationId/contacts", () =>
      HttpResponse.json({
        success: true,
        message: "OK.",
        data: {
          contacts: [
            {
              id: 5,
              organization_id: 1,
              name: "Aria Chen",
              display_name: "Aria Chen",
              is_organization: false,
              parent_id: null,
              email: "aria@example.com",
              phone: null,
              mobile: null,
              website: null,
              tax_id: null,
              industry: null,
              currency_code: "IDR",
              lang: "en",
              active: true,
              is_customer: true,
              is_supplier: false,
              created_at: "2026-01-01T00:00:00Z",
              updated_at: "2026-01-01T00:00:00Z",
            },
          ],
        },
      }),
    ),
    http.get("*/api/v1/organizations/:organizationId/crm/activities", () =>
      HttpResponse.json({
        success: true,
        message: "OK.",
        data: { activities: [activity] },
      }),
    ),
    http.get("*/api/v1/organizations/:organizationId/crm/leads/1/history", () =>
      HttpResponse.json({
        success: true,
        message: "OK.",
        data: {
          history: [
            {
              id: 1,
              prospect_id: 1,
              from_stage_id: null,
              to_stage_id: 1,
              from_status: "contacted",
              to_status: "qualified",
              probability: 30,
              notes: "Qualified on call",
              actor_id: 2,
              created_at: "2026-01-03T00:00:00Z",
            },
          ],
        },
      }),
    ),
    http.get("*/api/v1/organizations/:organizationId/crm/leads/1/buyers", () =>
      HttpResponse.json({
        success: true,
        message: "OK.",
        data: {
          buyers: [{ id: 7, prospect_id: 1, contact_id: 5, role: "champion", is_primary: true }],
        },
      }),
    ),
    http.get("*/api/v1/organizations/:organizationId/crm/leads/1/duplicates", () =>
      HttpResponse.json({
        success: true,
        message: "OK.",
        data: {
          duplicates: [
            {
              ...lead,
              id: 2,
              name: "Acme Duplicate",
              email: "dupe@example.com",
            },
          ],
        },
      }),
    ),
  );
});

describe("CrmRecordDetail", () => {
  it("shows the profile and linked activities", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CrmRecordDetail kind="lead" orgId="1" id="1" />);

    expect(
      await screen.findByRole("heading", { name: "Acme Website Inquiry" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Needs a faster onboarding workflow")).toBeInTheDocument();
    expect(screen.getAllByText("Send proposal").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("tab", { name: "Linimasa" }));
    expect(await screen.findByText("Discovery call")).toBeInTheDocument();
  });

  it("queries record activities by prospect and paginates", async () => {
    const requested: URLSearchParams[] = [];
    server.use(
      http.get("*/api/v1/organizations/:organizationId/crm/activities", ({ request }) => {
        const params = new URL(request.url).searchParams;
        requested.push(params);
        const page = Number(params.get("page") ?? "1");
        return HttpResponse.json({
          success: true,
          message: "OK.",
          data: {
            activities: [activity],
            meta: { pagination: { page, totalPages: 2, total: 2 } },
          },
        });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<CrmRecordDetail kind="lead" orgId="1" id="1" />);

    await screen.findByRole("heading", { name: "Acme Website Inquiry" });
    await user.click(screen.getByRole("tab", { name: "Linimasa" }));
    await waitFor(() => expect(requested.length).toBe(1));

    const first = requested[0]!;
    const filters = [...first.getAll("filter[]"), ...first.getAll("filter")];
    expect(filters.join("&")).toContain("prospect_id:eq:1");

    await user.click(screen.getByRole("button", { name: "Berikutnya" }));
    await waitFor(() => expect(requested.length).toBe(2));
    expect(requested[1]?.get("page")).toBe("2");
  });

  it("removes a buying committee member", async () => {
    let deleted = false;
    server.use(
      http.delete("*/api/v1/organizations/:organizationId/crm/leads/1/buyers/:buyerId", () => {
        deleted = true;
        return HttpResponse.json({ success: true, message: "OK.", data: {} });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<CrmRecordDetail kind="lead" orgId="1" id="1" />);

    await screen.findByRole("heading", { name: "Acme Website Inquiry" });
    await user.click(screen.getByRole("tab", { name: "Komite pembelian" }));
    expect(await screen.findByText("Aria Chen")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Hapus" }));

    await waitFor(() => expect(deleted).toBe(true));
  });

  it("merges a possible duplicate into the current record", async () => {
    let body: Record<string, unknown> | undefined;
    server.use(
      http.post(
        "*/api/v1/organizations/:organizationId/crm/leads/:id/merge",
        async ({ request }) => {
          body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            success: true,
            message: "OK.",
            data: { prospect: lead },
          });
        },
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<CrmRecordDetail kind="lead" orgId="1" id="1" />);

    await screen.findByRole("heading", { name: "Acme Website Inquiry" });
    await user.click(screen.getByRole("tab", { name: "Kemungkinan duplikat" }));
    expect(await screen.findByText("Acme Duplicate")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Gabungkan ke data ini" }));

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Gabungkan ke data ini" }));

    await waitFor(() => expect(body).toEqual({ target_id: 1 }));
  });
});
