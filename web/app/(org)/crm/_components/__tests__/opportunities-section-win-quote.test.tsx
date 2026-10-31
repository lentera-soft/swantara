import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, server } from "@/lib/tests";
import { OpportunitiesSection } from "../opportunities-section";

const { toastSuccess } = vi.hoisted(() => ({ toastSuccess: vi.fn() }));

vi.mock("sonner", () => ({
  toast: { success: toastSuccess, error: vi.fn() },
}));

const STAMP = "2026-01-01T00:00:00Z";

const opportunity = {
  id: 11,
  organization_id: 1,
  name: "Deal 11",
  type: "opportunity",
  contact_id: null,
  contact_name: null,
  email: null,
  phone: null,
  job_position: null,
  stage_id: 2,
  expected_revenue: 10000,
  probability: 50,
  priority: 1,
  salesperson_id: null,
  sales_group_id: null,
  source: null,
  medium: null,
  campaign: null,
  lost_reason: null,
  expected_close: "2026-06-30",
  closed_at: null,
  is_won: false,
  created_at: STAMP,
  updated_at: STAMP,
};

beforeEach(() => {
  toastSuccess.mockClear();
  server.use(
    http.get("*/api/v1/organizations/:organizationId/crm/opportunities", () =>
      HttpResponse.json({ success: true, message: "OK.", data: { opportunities: [opportunity] } }),
    ),
    http.get("*/api/v1/organizations/:organizationId/crm/stages", () =>
      HttpResponse.json({
        success: true,
        message: "OK.",
        data: {
          stages: [{ id: 2, name: "Proposal", sequence: 2, is_won: false, probability: 60 }],
        },
      }),
    ),
    http.get("*/api/v1/organizations/:organizationId/contacts", () =>
      HttpResponse.json({ success: true, message: "OK.", data: { contacts: [] } }),
    ),
    http.get("*/api/v1/organizations/:organizationId/crm/teams", () =>
      HttpResponse.json({ success: true, message: "OK.", data: { teams: [] } }),
    ),
    http.get("*/api/v1/organizations/:organizationId/price-books", () =>
      HttpResponse.json({ success: true, message: "OK.", data: { price_books: [] } }),
    ),
    http.get("*/api/v1/organizations/:organizationId/warehouses", () =>
      HttpResponse.json({ success: true, message: "OK.", data: { warehouses: [] } }),
    ),
    http.post("*/api/v1/organizations/:organizationId/crm/opportunities/:id/win", () =>
      HttpResponse.json({ success: true, message: "OK.", data: { opportunity: {} } }),
    ),
  );
});

describe("OpportunitiesSection win action", () => {
  it("offers an in-place quote draft after winning", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OpportunitiesSection orgId="1" />);

    await screen.findByText("Deal 11");
    await user.click(screen.getAllByRole("button", { name: "Tandai menang" })[0]!);

    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    const options = toastSuccess.mock.calls[0]?.[1] as
      | { action?: { onClick?: () => void } }
      | undefined;
    expect(options?.action?.onClick).toBeTypeOf("function");

    await act(async () => {
      options?.action?.onClick?.();
    });

    expect(await screen.findByRole("heading", { name: "Penawaran baru" })).toBeInTheDocument();
  });
});
