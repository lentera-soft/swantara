import { screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithProviders, server } from "@/lib/tests";
import { PerformanceChart } from "../performance-chart";

const statement = {
  organization_id: 1,
  period_id: 2,
  start: "2026-01-01",
  end: "2026-01-31",
  rows: [],
  revenue: 84320,
  cogs: 41000,
  gross_profit: 43320,
  expenses: 52300,
  net_income: 32020,
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
    http.get("*/api/v1/organizations/:organizationId/reports/profit-and-loss", () =>
      HttpResponse.json({ success: true, message: "OK.", data: statement }),
    ),
  );
});

describe("PerformanceChart", () => {
  it("renders the performance heading", async () => {
    renderWithProviders(<PerformanceChart />);

    expect(await screen.findByText("Kinerja")).toBeInTheDocument();
  });

  it("renders a chart with revenue, expenses and net profit", async () => {
    renderWithProviders(<PerformanceChart />);

    const chart = await screen.findByRole("img", { name: /Kinerja/ });
    const label = (chart.getAttribute("aria-label") ?? "").replace(/\u00a0/g, " ");
    expect(label).toContain("Pendapatan: Rp 84.320,00");
    expect(label).toContain("Biaya: Rp 52.300,00");
    expect(label).toContain("Laba bersih: Rp 32.020,00");
  });
});
