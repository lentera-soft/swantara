import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithProviders, server } from "@/lib/tests";
import { TeamsSection } from "../teams-section";

const teams = [
  { id: 1, name: "Enterprise", leader_id: 10, organization_id: 1 },
  { id: 2, name: "SMB", leader_id: null, organization_id: 1 },
];

const contacts = [{ id: 10, name: "Aria Chen", display_name: "Aria", organization_id: 1 }];

beforeEach(() => {
  server.use(
    http.get("*/api/v1/organizations/:organizationId/crm/teams", () =>
      HttpResponse.json({ success: true, message: "OK.", data: { teams } }),
    ),
    http.get("*/api/v1/organizations/:organizationId/contacts", () =>
      HttpResponse.json({ success: true, message: "OK.", data: { contacts } }),
    ),
  );
});

describe("TeamsSection", () => {
  it("lists sales teams with their leaders", async () => {
    renderWithProviders(<TeamsSection orgId="1" />);

    expect(await screen.findByText("Enterprise")).toBeInTheDocument();
    expect(screen.getByText("SMB")).toBeInTheDocument();
    expect(screen.getByText("Aria")).toBeInTheDocument();
    expect(screen.getByText("Belum ada pemimpin")).toBeInTheDocument();
  });

  it("links each team name to its detail page", async () => {
    renderWithProviders(<TeamsSection orgId="1" />);

    const link = await screen.findByRole("link", { name: "Enterprise" });
    expect(link).toHaveAttribute("href", "/crm/teams/1");
  });

  it("links the add-team button to the new page", async () => {
    renderWithProviders(<TeamsSection orgId="1" />);

    const addLink = await screen.findByRole("link", { name: /Tambah tim/ });
    expect(addLink).toHaveAttribute("href", "/crm/teams/new");
  });

  it("filters teams through the search box", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TeamsSection orgId="1" />);

    await screen.findByText("Enterprise");
    await user.type(screen.getByPlaceholderText("Cari tim…"), "SMB");

    expect((await screen.findAllByText("SMB")).length).toBeGreaterThan(0);
    await waitFor(() => expect(screen.queryByText("Enterprise")).not.toBeInTheDocument());
  });

  it("deletes a team through the row actions menu", async () => {
    const deleted: number[] = [];
    server.use(
      http.delete("*/api/v1/organizations/:organizationId/crm/teams/:id", ({ params }) => {
        deleted.push(Number(params.id));
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<TeamsSection orgId="1" />);
    await screen.findByText("Enterprise");

    await user.click(screen.getAllByRole("button", { name: "Aksi" })[0]!);
    const menu = await screen.findByRole("menu");
    await user.click(within(menu).getByRole("menuitem", { name: "Hapus" }));

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Hapus" }));

    await waitFor(() => expect(deleted).toEqual([1]));
  });
});
