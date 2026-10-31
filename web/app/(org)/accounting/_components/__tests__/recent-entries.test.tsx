import { screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithProviders, server } from "@/lib/tests";
import { formatDate } from "@/lib/utils";
import { RecentEntries } from "../recent-entries";

const movements = [
  {
    id: 9,
    organization_id: 1,
    journal_id: 1,
    name: "Payment received",
    date: "2026-08-05T00:00:00Z",
    ref: "REF-009",
    state: "posted",
    currency_code: null,
    origin_type: null,
    origin_id: null,
    reversed_entry_id: null,
    posted_at: null,
    posted_by: null,
    created_at: "2026-08-05T00:00:00Z",
    updated_at: "2026-08-05T00:00:00Z",
  },
  {
    id: 8,
    organization_id: 1,
    journal_id: 1,
    name: null,
    date: "2026-08-04T00:00:00Z",
    ref: "JE-008",
    state: "draft",
    currency_code: null,
    origin_type: null,
    origin_id: null,
    reversed_entry_id: null,
    posted_at: null,
    posted_by: null,
    created_at: "2026-08-04T00:00:00Z",
    updated_at: "2026-08-04T00:00:00Z",
  },
];

beforeEach(() => {
  server.use(
    http.get("*/api/v1/organizations/:organizationId/journal-entries", () =>
      HttpResponse.json({
        success: true,
        message: "OK.",
        data: { movements },
      }),
    ),
  );
});

describe("RecentEntries", () => {
  it("renders entry descriptions with dates", async () => {
    renderWithProviders(<RecentEntries />);

    expect(await screen.findByText("Payment received")).toBeInTheDocument();
    expect(screen.getByText("JE-008")).toBeInTheDocument();
    expect(screen.getByText(formatDate("2026-08-05T00:00:00Z"))).toBeInTheDocument();
  });

  it("renders the entry state badge", async () => {
    renderWithProviders(<RecentEntries />);

    expect(await screen.findByText("posted")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
  });
});
