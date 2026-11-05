import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithProviders, server } from "@/lib/tests";
import { TeamDetailSection } from "../team-detail-section";

beforeEach(() => {
  server.use(
    http.get("*/api/v1/organizations/:organizationId/crm/teams/:id", () =>
      HttpResponse.json({
        success: true,
        message: "OK.",
        data: {
          team: {
            id: 5,
            name: "Enterprise",
            leader_id: 10,
            organization_id: 1,
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-02T00:00:00Z",
          },
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
              id: 10,
              name: "Aria Chen",
              display_name: "Aria",
              organization_id: 1,
              is_employee: true,
            },
          ],
        },
      }),
    ),
  );
});

describe("TeamDetailSection", () => {
  it("shows the team name, leader and creation date", async () => {
    renderWithProviders(<TeamDetailSection orgId="1" teamId="5" />);

    expect(await screen.findByRole("heading", { name: "Enterprise" })).toBeInTheDocument();
    expect(screen.getByText("Aria")).toBeInTheDocument();
  });

  it("links the edit button to the edit page", async () => {
    renderWithProviders(<TeamDetailSection orgId="1" teamId="5" />);

    const edit = await screen.findByRole("link", { name: /Ubah tim penjualan/ });
    expect(edit).toHaveAttribute("href", "/crm/teams/5/edit");
  });

  it("deletes the team after confirming", async () => {
    const deleted: string[] = [];
    server.use(
      http.delete("*/api/v1/organizations/:organizationId/crm/teams/:id", ({ params }) => {
        deleted.push(String(params.id));
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<TeamDetailSection orgId="1" teamId="5" />);

    await user.click(await screen.findByRole("button", { name: /Hapus/ }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Hapus" }));

    await waitFor(() => expect(deleted).toEqual(["5"]));
  });
});
