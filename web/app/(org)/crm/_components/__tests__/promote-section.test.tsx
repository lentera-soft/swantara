import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CrmLead } from "@/lib/services/swantara";
import { renderWithProviders, server } from "@/lib/tests";
import { PromoteDialog } from "../promote-section";

const qualifiedLead = {
  id: 5,
  contactId: 9,
  contactName: "Ada Lovelace",
  needSummary: "Needs a CRM",
} as CrmLead;

const stages = [
  { id: 2, name: "Qualified", sequence: 2, is_won: false, probability: 30 },
  { id: 3, name: "Proposal", sequence: 3, is_won: false, probability: 60 },
];

function seedStages() {
  server.use(
    http.get("*/api/v1/organizations/:organizationId/crm/stages", () =>
      HttpResponse.json({ success: true, message: "OK.", data: { stages } }),
    ),
  );
}

beforeEach(() => {
  seedStages();
});

describe("PromoteDialog", () => {
  it("renders the promote form with stages", async () => {
    renderWithProviders(
      <PromoteDialog open onOpenChange={() => {}} orgId="1" prospectId="5" onPromoted={() => {}} />,
    );

    expect(await screen.findByText("Promosikan prospek menjadi peluang")).toBeInTheDocument();
    expect(screen.getByText("Pendapatan yang diharapkan")).toBeInTheDocument();
  });

  it("requires a stage before promoting", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PromoteDialog open onOpenChange={() => {}} orgId="1" prospectId="5" onPromoted={() => {}} />,
    );

    await screen.findByText("Promosikan prospek menjadi peluang");
    await user.click(screen.getByRole("button", { name: "Promosikan" }));

    expect(await screen.findByText("Pilih tahap.")).toBeInTheDocument();
  });

  it("promotes with optional fields left blank", async () => {
    let payload: unknown = null;
    server.use(
      http.post(
        "*/api/v1/organizations/:organizationId/crm/leads/:id/promote",
        async ({ request }) => {
          payload = await request.json();
          return HttpResponse.json({ success: true, message: "OK.", data: { opportunity: {} } });
        },
      ),
    );
    const onPromoted = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <PromoteDialog
        open
        onOpenChange={() => {}}
        orgId="1"
        prospectId="5"
        initial={qualifiedLead}
        onPromoted={onPromoted}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "Tahap" }));
    await user.click(await screen.findByRole("option", { name: "Qualified — 30%" }));
    await user.click(screen.getByRole("button", { name: "Promosikan" }));

    await waitFor(() => expect(onPromoted).toHaveBeenCalled());
    expect(payload).toMatchObject({ stage_id: 2, probability: null, expected_close: null });
  });

  it("defaults revenue and priority from the lead instead of zeroing them", async () => {
    let payload: unknown = null;
    server.use(
      http.post(
        "*/api/v1/organizations/:organizationId/crm/leads/:id/promote",
        async ({ request }) => {
          payload = await request.json();
          return HttpResponse.json({ success: true, message: "OK.", data: { opportunity: {} } });
        },
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(
      <PromoteDialog
        open
        onOpenChange={() => {}}
        orgId="1"
        prospectId="5"
        initial={
          {
            ...qualifiedLead,
            expectedRevenue: 750,
            priority: 2,
          } as CrmLead
        }
        onPromoted={() => {}}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "Tahap" }));
    await user.click(await screen.findByRole("option", { name: "Qualified — 30%" }));
    await user.click(screen.getByRole("button", { name: "Promosikan" }));

    await waitFor(() => expect(payload).not.toBeNull());
    expect(payload).toMatchObject({
      stage_id: 2,
      expected_revenue: 750,
      priority: 2,
    });
  });

  it("falls back to the lead budget when expected revenue is empty", async () => {
    let payload: unknown = null;
    server.use(
      http.post(
        "*/api/v1/organizations/:organizationId/crm/leads/:id/promote",
        async ({ request }) => {
          payload = await request.json();
          return HttpResponse.json({ success: true, message: "OK.", data: { opportunity: {} } });
        },
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(
      <PromoteDialog
        open
        onOpenChange={() => {}}
        orgId="1"
        prospectId="5"
        initial={{ ...qualifiedLead, expectedRevenue: 0, budgetAmount: 1200 } as CrmLead}
        onPromoted={() => {}}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "Tahap" }));
    await user.click(await screen.findByRole("option", { name: "Qualified — 30%" }));
    await user.click(screen.getByRole("button", { name: "Promosikan" }));

    await waitFor(() => expect(payload).not.toBeNull());
    expect(payload).toMatchObject({ expected_revenue: 1200 });
  });

  it("sends probability and expected close when provided", async () => {
    let payload: unknown = null;
    server.use(
      http.post(
        "*/api/v1/organizations/:organizationId/crm/leads/:id/promote",
        async ({ request }) => {
          payload = await request.json();
          return HttpResponse.json({ success: true, message: "OK.", data: { opportunity: {} } });
        },
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(
      <PromoteDialog
        open
        onOpenChange={() => {}}
        orgId="1"
        prospectId="5"
        initial={qualifiedLead}
        onPromoted={() => {}}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "Tahap" }));
    await user.click(await screen.findByRole("option", { name: "Proposal — 60%" }));
    await user.type(screen.getByLabelText("Probabilitas %"), "70");
    await user.click(screen.getByRole("button", { name: "Promosikan" }));

    await waitFor(() => expect(payload).toMatchObject({ stage_id: 3, probability: 70 }));
  });

  it("closes from the cancel button without promoting", async () => {
    let promoteCalls = 0;
    server.use(
      http.post("*/api/v1/organizations/:organizationId/crm/leads/:id/promote", () => {
        promoteCalls += 1;
        return HttpResponse.json({ success: true, message: "OK.", data: {} });
      }),
    );
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <PromoteDialog
        open
        onOpenChange={onOpenChange}
        orgId="1"
        prospectId="5"
        onPromoted={() => {}}
      />,
    );

    await screen.findByText("Promosikan prospek menjadi peluang");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(promoteCalls).toBe(0);
  });

  it("flags configured required fields and blocks submitting without override", async () => {
    let promoteCalls = 0;
    server.use(
      http.get("*/api/v1/organizations/:organizationId/system-configs", () =>
        HttpResponse.json({
          success: true,
          message: "OK.",
          data: {
            systemConfigs: [
              {
                id: 1,
                key: "crm.promotion_required_fields",
                value: ["contact", "need", "budget"],
                created_at: "2026-01-01T00:00:00Z",
                updated_at: "2026-01-01T00:00:00Z",
              },
            ],
          },
        }),
      ),
      http.post("*/api/v1/organizations/:organizationId/crm/leads/:id/promote", () => {
        promoteCalls += 1;
        return HttpResponse.json({ success: true, message: "OK.", data: {} });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(
      <PromoteDialog
        open
        onOpenChange={() => {}}
        orgId="1"
        prospectId="5"
        initial={qualifiedLead}
        onPromoted={() => {}}
      />,
    );

    expect(
      await screen.findByText(
        "Belum diisi: konfirmasi anggaran. Lengkapi atau gunakan override yang berwenang.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("combobox", { name: "Tahap" }));
    await user.click(await screen.findByRole("option", { name: "Qualified — 30%" }));
    await user.click(screen.getByRole("button", { name: "Promosikan" }));

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(promoteCalls).toBe(0);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("treats email alone as a satisfied contact requirement", async () => {
    server.use(
      http.get("*/api/v1/organizations/:organizationId/system-configs", () =>
        HttpResponse.json({
          success: true,
          message: "OK.",
          data: {
            systemConfigs: [
              {
                id: 1,
                key: "crm.promotion_required_fields",
                value: ["contact", "need"],
                created_at: "2026-01-01T00:00:00Z",
                updated_at: "2026-01-01T00:00:00Z",
              },
            ],
          },
        }),
      ),
    );
    renderWithProviders(
      <PromoteDialog
        open
        onOpenChange={() => {}}
        orgId="1"
        prospectId="5"
        initial={
          {
            contactId: null,
            contactName: null,
            email: "ada@example.com",
            needSummary: "Needs CRM",
          } as CrmLead
        }
        onPromoted={() => {}}
      />,
    );

    await screen.findByText("Promosikan prospek menjadi peluang");
    expect(screen.queryByText(/Belum diisi:/)).not.toBeInTheDocument();
  });
});
