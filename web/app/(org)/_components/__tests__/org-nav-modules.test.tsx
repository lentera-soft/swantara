import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SidebarProvider } from "@/components/app-shell";
import { renderWithProviders } from "@/lib/tests";
import { OrgActiveProvider } from "@/providers/org-active-provider";
import { OrgNav } from "../org-nav";

function renderNav() {
  renderWithProviders(
    <OrgActiveProvider orgId={1}>
      <SidebarProvider>
        <OrgNav />
      </SidebarProvider>
    </OrgActiveProvider>,
  );
}

describe("OrgNav", () => {
  it("regression: groups former Other items into Finance and Settings with no Other menu", async () => {
    const user = userEvent.setup();
    renderNav();

    await user.click(await screen.findByRole("button", { name: "Keuangan" }));
    expect(await screen.findByRole("link", { name: "Laporan" })).toHaveAttribute(
      "href",
      "/reports",
    );
    expect(screen.getByRole("link", { name: "Data Referensi" })).toHaveAttribute(
      "href",
      "/reference",
    );
    expect(screen.queryByRole("button", { name: "Other" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Persetujuan" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Log Audit" })).toBeNull();
    expect(screen.getByRole("link", { name: "Pengaturan" })).toHaveAttribute("href", "/settings");
  });
});
