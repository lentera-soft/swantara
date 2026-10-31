import { screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithProviders, server } from "@/lib/tests";
import { AccountsList } from "../accounts-list";

const trialBalance = {
  organization_id: 1,
  period_id: 2,
  start: "2026-01-01",
  end: "2026-01-31",
  rows: [
    {
      account_id: 10,
      code: "1000",
      name: "Current assets",
      account_type: "asset",
      opening_debit: 0,
      opening_credit: 0,
      period_debit: 58200,
      period_credit: 0,
      closing_debit: 58200,
      closing_credit: 0,
    },
    {
      account_id: 20,
      code: "2000",
      name: "Accounts payable",
      account_type: "liability",
      opening_debit: 0,
      opening_credit: 0,
      period_debit: 12800,
      period_credit: 0,
      closing_debit: 12800,
      closing_credit: 0,
    },
  ],
};

beforeEach(() => {
  server.use(
    http.get("*/api/v1/organizations/:organizationId/tax-periods", () =>
      HttpResponse.json({
        success: true,
        message: "OK.",
        data: {
          tax_periods: [
            {
              id: 2,
              organization_id: 1,
              tax_year_id: 1,
              name: "Jan 2026",
              date_start: "2026-01-01",
              date_end: "2026-01-31",
              state: "open",
              created_at: "2026-01-01T00:00:00Z",
              updated_at: "2026-01-01T00:00:00Z",
            },
          ],
        },
      }),
    ),
    http.get("*/api/v1/organizations/:organizationId/reports/trial-balance", () =>
      HttpResponse.json({ success: true, message: "OK.", data: trialBalance }),
    ),
  );
});

describe("AccountsList", () => {
  it("renders account names with balances", async () => {
    renderWithProviders(<AccountsList />);

    expect(await screen.findByText("Current assets")).toBeInTheDocument();
    expect(screen.getByText("Accounts payable")).toBeInTheDocument();
    expect(screen.getByText("1000")).toBeInTheDocument();
    expect(screen.getByText("Rp 58.200,00")).toBeInTheDocument();
    expect(screen.getByText("Rp 12.800,00")).toBeInTheDocument();
  });

  it("renders account type badges", async () => {
    renderWithProviders(<AccountsList />);

    expect(await screen.findByText("asset")).toBeInTheDocument();
    expect(screen.getByText("liability")).toBeInTheDocument();
  });
});
