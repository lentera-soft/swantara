import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithProviders, server } from "@/lib/tests";
import { CarriersSection } from "../carriers-section";

const carriers = [
  { id: 1, name: "JNE", tracking_url_tpl: "https://jne.co.id/track/{tracking}" },
  { id: 2, name: "Internal", tracking_url_tpl: null },
];

function seed() {
  server.use(
    http.get("*/api/v1/organizations/*/carriers", () =>
      HttpResponse.json({ success: true, message: "OK.", data: { carriers } }),
    ),
  );
}

beforeEach(() => {
  seed();
});

describe("CarriersSection", () => {
  it("lists carriers and their tracking templates", async () => {
    renderWithProviders(<CarriersSection orgId="1" />);

    expect(await screen.findByText("JNE")).toBeInTheDocument();
    expect(screen.getByText("https://jne.co.id/track/{tracking}")).toBeInTheDocument();
    expect(screen.getByText("Internal")).toBeInTheDocument();
  });

  it("creates a carrier", async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post("*/api/v1/organizations/*/carriers", async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(
          { success: true, message: "Dibuat.", data: { carrier: { id: 3 } } },
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<CarriersSection orgId="1" />);

    await screen.findByText("JNE");
    await user.click(screen.getByRole("button", { name: "Tambah kurir" }));
    const dialog = await screen.findByRole("dialog");

    await user.type(within(dialog).getByLabelText("Nama"), "SiCepat");
    await user.type(
      within(dialog).getByLabelText("Templat URL pelacakan"),
      "https://sicepat.com/track/TRACKING",
    );
    await user.click(within(dialog).getByRole("button", { name: "Simpan kurir" }));

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({
      name: "SiCepat",
      tracking_url_tpl: "https://sicepat.com/track/TRACKING",
    });
  });
});
