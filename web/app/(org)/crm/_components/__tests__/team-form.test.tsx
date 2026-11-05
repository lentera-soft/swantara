import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithProviders, server } from "@/lib/tests";
import { TeamForm } from "../team-form";

const employeeContact = {
  id: 10,
  name: "Aria Chen",
  display_name: "Aria",
  organization_id: 1,
  is_employee: true,
};

const nonEmployeeContact = {
  id: 11,
  name: "Acme Corp",
  display_name: null,
  organization_id: 1,
  is_employee: false,
};

beforeEach(() => {
  server.use(
    http.get("*/api/v1/organizations/:organizationId/contacts", () =>
      HttpResponse.json({
        success: true,
        message: "OK.",
        data: { contacts: [employeeContact, nonEmployeeContact] },
      }),
    ),
  );
});

describe("TeamForm", () => {
  it("creates a sales team", async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post("*/api/v1/organizations/:organizationId/crm/teams", async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(
          {
            success: true,
            message: "OK.",
            data: { team: { id: 42, name: "EMEA", leader_id: 10, organization_id: 1 } },
          },
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<TeamForm orgId="1" />);

    await user.type(await screen.findByLabelText("Nama"), "EMEA");
    await user.click(screen.getByRole("combobox", { name: "Pemimpin tim" }));
    await user.click(await screen.findByRole("option", { name: "Aria" }));
    await user.click(screen.getByRole("button", { name: "Tambah tim" }));

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({ name: "EMEA", leader_id: 10 });
  });

  it("updates an existing sales team", async () => {
    const bodies: unknown[] = [];
    server.use(
      http.put("*/api/v1/organizations/:organizationId/crm/teams/:id", async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({
          success: true,
          message: "OK.",
          data: { team: { id: 7, name: "APAC", leader_id: null, organization_id: 1 } },
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <TeamForm
        orgId="1"
        initial={{
          id: 7,
          name: "APAC",
          leaderId: null,
          organizationId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        }}
      />,
    );

    const nameInput = await screen.findByLabelText("Nama");
    expect(nameInput).toHaveValue("APAC");
    await user.clear(nameInput);
    await user.type(nameInput, "APAC");
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({ name: "APAC", leader_id: null });
  });

  it("blocks submission when the name is empty", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TeamForm orgId="1" />);

    await user.click(await screen.findByRole("button", { name: "Tambah tim" }));

    expect(await screen.findByText("Nama tim wajib diisi")).toBeInTheDocument();
  });

  it("lists only employee contacts in the leader select", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TeamForm orgId="1" />);

    await screen.findByLabelText("Nama");
    await user.click(screen.getByRole("combobox", { name: "Pemimpin tim" }));
    const listbox = await screen.findByRole("listbox");

    expect(within(listbox).getByRole("option", { name: "Aria" })).toBeInTheDocument();
    expect(within(listbox).queryByRole("option", { name: "Acme Corp" })).not.toBeInTheDocument();
  });
});
