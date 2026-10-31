import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/lib/tests";
import { exportCsv } from "@/lib/utils/csv";
import { DashboardActions } from "../dashboard-actions";

vi.mock("@/lib/utils/csv", () => ({ exportCsv: vi.fn() }));

afterEach(() => {
  vi.clearAllMocks();
});

describe("DashboardActions", () => {
  it("renders export and new-record actions", async () => {
    renderWithProviders(<DashboardActions />);

    expect(await screen.findByText("Ekspor Laporan")).toBeInTheDocument();
    expect(screen.getByText("Buat cepat")).toBeInTheDocument();
  });

  it("exports the dashboard summary as csv", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DashboardActions />);

    await user.click(await screen.findByText("Ekspor Laporan"));

    expect(exportCsv).toHaveBeenCalledTimes(1);
    expect(exportCsv).toHaveBeenCalledWith(
      expect.stringMatching(/^dashboard-\d{4}-\d{2}-\d{2}$/),
      ["Metrik", "Nilai"],
      expect.arrayContaining([["Pendapatan", expect.any(Number)]]),
    );
  });

  it("opens the new-record menu with entity links", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DashboardActions />);

    await user.click(await screen.findByText("Buat cepat"));

    const customerItem = await screen.findByText("Pelanggan baru");
    expect(customerItem).toBeInTheDocument();
    expect(customerItem.closest("a")).toHaveAttribute("href", "/contacts");
  });
});
