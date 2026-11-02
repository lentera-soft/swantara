import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithProviders, server } from "@/lib/tests";
import { AdvanceStageDialog } from "../advance-stage-dialog";

const stages = [
  { id: 2, name: "Proposal", sequence: 2, is_won: false, is_lost: false, probability: 60 },
  {
    id: 5,
    name: "Negosiasi",
    sequence: 5,
    is_won: false,
    is_lost: false,
    probability: 70,
    exit_criteria: "Demo dijadwalkan",
  },
  { id: 8, name: "Kalah", sequence: 8, is_won: false, is_lost: true, probability: 0 },
  { id: 9, name: "Menang", sequence: 9, is_won: true, is_lost: false, probability: 100 },
];

function seed() {
  server.use(
    http.get("*/api/v1/organizations/:organizationId/crm/stages", () =>
      HttpResponse.json({ success: true, message: "OK.", data: { stages } }),
    ),
  );
}

beforeEach(() => {
  seed();
});

function renderDialog() {
  renderWithProviders(
    <AdvanceStageDialog
      open
      onOpenChange={() => {}}
      orgId="1"
      opportunityId="11"
      currentStageId={2}
      onDone={() => {}}
    />,
  );
}

describe("AdvanceStageDialog", () => {
  it("excludes the current stage from the options", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("combobox", { name: "Tahap" }));
    const options = await screen.findAllByRole("option");
    const labels = options.map((option) => option.textContent ?? "");
    expect(labels.some((label) => label.startsWith("Proposal"))).toBe(false);
    expect(labels.some((label) => label.startsWith("Negosiasi"))).toBe(true);
  });

  it("requires exit criteria acknowledgement before moving", async () => {
    let body: Record<string, unknown> | undefined;
    server.use(
      http.post(
        "*/api/v1/organizations/:organizationId/crm/opportunities/11/advance-stage",
        async ({ request }) => {
          body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({ success: true, message: "OK.", data: { opportunity: {} } });
        },
      ),
    );
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("combobox", { name: "Tahap" }));
    await user.click(await screen.findByRole("option", { name: "Negosiasi — 70%" }));
    await user.click(screen.getByRole("button", { name: "Pindahkan tahap" }));

    expect(
      await screen.findByText("Konfirmasi kriteria keluar sebelum pindah."),
    ).toBeInTheDocument();
    expect(body).toBeUndefined();

    await user.click(
      screen.getByRole("checkbox", { name: "Saya konfirmasi kriteria keluar telah terpenuhi" }),
    );
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Pindahkan tahap" }));

    await waitFor(() => expect(body).toBeDefined());
    expect(body).toMatchObject({ stage_id: 5, exit_criteria_met: true, lost_reason: null });
  });

  it("requires a lost reason when moving to a lost stage", async () => {
    let body: Record<string, unknown> | undefined;
    server.use(
      http.post(
        "*/api/v1/organizations/:organizationId/crm/opportunities/11/advance-stage",
        async ({ request }) => {
          body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({ success: true, message: "OK.", data: { opportunity: {} } });
        },
      ),
    );
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("combobox", { name: "Tahap" }));
    await user.click(await screen.findByRole("option", { name: "Kalah — 0%" }));
    await user.click(screen.getByRole("button", { name: "Pindahkan tahap" }));

    expect(await screen.findByText("Alasan kalah wajib diisi.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Alasan kalah"), "Harga terlalu tinggi");
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Pindahkan tahap" }));

    await waitFor(() => expect(body).toBeDefined());
    expect(body).toMatchObject({ stage_id: 8, lost_reason: "Harga terlalu tinggi" });
  });
});
