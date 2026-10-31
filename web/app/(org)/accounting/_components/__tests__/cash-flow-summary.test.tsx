import { screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithProviders, server } from "@/lib/tests";
import { CashFlowSummary } from "../cash-flow-summary";

const flow = {
  organization_id: 1,
  start: "2026-08-01",
  end: "2026-08-31",
  operating: 24000,
  investing: -8000,
  financing: 5000,
  net_change: 21000,
  opening_cash: 104000,
  closing_cash: 125000,
};

beforeEach(() => {
  server.use(
    http.get("*/api/v1/organizations/:organizationId/reports/cash-flow", () =>
      HttpResponse.json({ success: true, message: "OK.", data: flow }),
    ),
  );
});

describe("CashFlowSummary", () => {
  it("renders cash flow heading with description", () => {
    renderWithProviders(<CashFlowSummary />);

    expect(screen.getByText("Arus kas")).toBeInTheDocument();
    expect(screen.getByText("Pemasukan dan pengeluaran kas bulan ini.")).toBeInTheDocument();
  });

  it("renders operating, investing, financing and net rows", async () => {
    renderWithProviders(<CashFlowSummary />);

    expect(await screen.findByText("Arus kas operasi")).toBeInTheDocument();
    expect(screen.getByText("Arus kas investasi")).toBeInTheDocument();
    expect(screen.getByText("Arus kas pendanaan")).toBeInTheDocument();
    expect(screen.getByText("Arus kas bersih")).toBeInTheDocument();
    expect(screen.getByText("Rp 24.000,00")).toBeInTheDocument();
    expect(screen.getByText("-Rp 8.000,00")).toBeInTheDocument();
  });
});
