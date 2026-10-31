import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, server } from "@/lib/tests";
import { InquiriesSection } from "../inquiries-section";

const inquiry = {
  id: 21,
  organizationId: 1,
  name: "Nadia Putri",
  email: "nadia@example.com",
  company: "Northwind",
  message: "Please send a proposal.",
  status: "new",
  source: "website",
  medium: "email",
  campaign: "spring",
  prospectId: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

function filters(params: URLSearchParams) {
  return [...params.getAll("filter[]"), ...params.getAll("filter")].join("&");
}

beforeEach(() => {
  server.use(
    http.get("*/api/v1/organizations/:organizationId/crm/inquiries", ({ request }) => {
      const params = new URL(request.url).searchParams;
      const page = Number(params.get("page") ?? "1");
      return HttpResponse.json({
        success: true,
        message: "OK.",
        data: {
          inquiries: [inquiry],
          meta: { pagination: { page, totalPages: 2, total: 2 } },
        },
      });
    }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("InquiriesSection", () => {
  it("applies server filters and paginates", async () => {
    const requested: URLSearchParams[] = [];
    server.use(
      http.get("*/api/v1/organizations/:organizationId/crm/inquiries", ({ request }) => {
        const params = new URL(request.url).searchParams;
        requested.push(params);
        const page = Number(params.get("page") ?? "1");
        return HttpResponse.json({
          success: true,
          message: "OK.",
          data: {
            inquiries: [inquiry],
            meta: { pagination: { page, totalPages: 2, total: 2 } },
          },
        });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<InquiriesSection orgId="1" />);

    await screen.findByText("Nadia Putri");
    expect(filters(requested[0]!)).toContain("status:eq:new");

    await user.click(screen.getByRole("combobox", { name: "Sumber" }));
    await user.click(await screen.findByRole("option", { name: "website" }));

    await waitFor(() => expect(requested.length).toBeGreaterThan(1));
    const withSource = requested[requested.length - 1]!;
    expect(filters(withSource)).toContain("status:eq:new");
    expect(filters(withSource)).toContain("source:eq:website");

    await user.click(screen.getByRole("button", { name: "Berikutnya" }));
    await waitFor(() => expect(requested.at(-1)?.get("page")).toBe("2"));
  });

  it("retries duplicate conversion with an explicit override", async () => {
    const bodies: Record<string, unknown>[] = [];
    vi.spyOn(window, "confirm").mockReturnValue(true);
    server.use(
      http.post(
        "*/api/v1/organizations/:organizationId/crm/inquiries/:id/convert",
        async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          bodies.push(body);
          if (bodies.length === 1) {
            return HttpResponse.json(
              { success: false, message: "A prospect with this email already exists." },
              { status: 409 },
            );
          }
          return HttpResponse.json({
            success: true,
            message: "OK.",
            data: { inquiry: { ...inquiry, prospectId: 9 }, lead_id: 9 },
          });
        },
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<InquiriesSection orgId="1" />);

    await screen.findByText("Nadia Putri");
    await user.click(screen.getByRole("button", { name: "Konversi ke prospek" }));

    await waitFor(() => expect(bodies.length).toBe(2));
    expect(bodies[0]?.allow_duplicate).toBe(false);
    expect(bodies[1]?.allow_duplicate).toBe(true);
  });
});
