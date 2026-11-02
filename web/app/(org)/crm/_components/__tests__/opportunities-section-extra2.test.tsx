import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { navigationMock, renderWithProviders, server } from "@/lib/tests";
import { OpportunitiesSection } from "../opportunities-section";

const STAMP = "2026-01-01T00:00:00Z";

function lead(id: number, patch: Record<string, unknown>) {
  return {
    id,
    organization_id: 1,
    name: `Deal ${id}`,
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
    ...patch,
  };
}

const stages = [{ id: 2, name: "Proposal", sequence: 2, is_won: false, probability: 60 }];

function seedOpportunities(opportunities: unknown[]) {
  server.use(
    http.get("*/api/v1/organizations/:organizationId/crm/opportunities", () =>
      HttpResponse.json({ success: true, message: "OK.", data: { opportunities } }),
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
}

beforeEach(() => {
  seedOpportunities([lead(11, {}), lead(12, { stage_id: 999, expected_close: null })]);
});

describe("OpportunitiesSection extra2", () => {
  it("falls back to dash for unknown stage and missing close date", async () => {
    renderWithProviders(<OpportunitiesSection orgId="1" />);

    expect(await screen.findByText("Deal 11")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("marks an open opportunity won", async () => {
    let winCalls = 0;
    server.use(
      http.post("*/api/v1/organizations/:organizationId/crm/opportunities/:id/win", () => {
        winCalls += 1;
        return HttpResponse.json({ success: true, message: "OK.", data: { opportunity: {} } });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<OpportunitiesSection orgId="1" />);

    await screen.findByText("Deal 11");
    await user.click(screen.getAllByRole("button", { name: "Aksi" })[0]!);
    await user.click(await screen.findByRole("menuitem", { name: "Tandai menang" }));

    await waitFor(() => expect(winCalls).toBe(1));
  });

  it("opens the lost-reason dialog from the lose action", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OpportunitiesSection orgId="1" />);

    await screen.findByText("Deal 11");
    await user.click(screen.getAllByRole("button", { name: "Aksi" })[0]!);
    await user.click(await screen.findByRole("menuitem", { name: "Tandai kalah" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Jelaskan mengapa peluang ini kalah.")).toBeInTheDocument();
  });

  it("hides win and lose actions for closed opportunities", async () => {
    const user = userEvent.setup();
    seedOpportunities([
      lead(11, {}),
      lead(13, { lost_reason: "Too expensive", closed_at: "2026-03-01T00:00:00Z" }),
    ]);
    renderWithProviders(<OpportunitiesSection orgId="1" />);

    await screen.findByText("Deal 13");
    const menus = screen.getAllByRole("button", { name: "Aksi" });
    expect(menus).toHaveLength(2);

    await user.click(menus[0]!);
    await screen.findByRole("menuitem", { name: "Tandai menang" });
    expect(screen.getByRole("menuitem", { name: "Tandai kalah" })).toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(menus[1]!);
    await screen.findByRole("menuitem", { name: "Ubah peluang" });
    expect(screen.queryByRole("menuitem", { name: "Tandai menang" })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: "Tandai kalah" })).toBeNull();
  });

  it("deletes an opportunity from the row actions", async () => {
    let deleteCalls = 0;
    server.use(
      http.delete("*/api/v1/organizations/:organizationId/crm/opportunities/:id", () => {
        deleteCalls += 1;
        return HttpResponse.json({ success: true, message: "OK.", data: {} });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<OpportunitiesSection orgId="1" />);

    await screen.findByText("Deal 11");
    await user.click(screen.getAllByRole("button", { name: "Aksi" })[0]!);
    await user.click(await screen.findByRole("menuitem", { name: "Hapus peluang" }));
    await user.click(await screen.findByRole("button", { name: "Hapus" }));

    await waitFor(() => expect(deleteCalls).toBe(1));
  });

  it("navigates to the edit page from the row actions", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OpportunitiesSection orgId="1" />);

    await screen.findByText("Deal 11");
    await user.click(screen.getAllByRole("button", { name: "Aksi" })[0]!);
    await user.click(await screen.findByRole("menuitem", { name: "Ubah peluang" }));

    expect(navigationMock.push).toHaveBeenCalledWith("/crm/opportunities/11/edit");
  });

  it("shows the error state with retry", async () => {
    server.use(
      http.get("*/api/v1/organizations/:organizationId/crm/opportunities", () =>
        HttpResponse.json({ success: false, message: "opp boom" }, { status: 500 }),
      ),
    );
    renderWithProviders(<OpportunitiesSection orgId="1" />);

    expect(await screen.findByText("opp boom")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeInTheDocument();
  });
});
