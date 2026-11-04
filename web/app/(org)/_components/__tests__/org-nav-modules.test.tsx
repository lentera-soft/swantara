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
    expect(screen.queryByRole("link", { name: "Data Induk" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Other" })).toBeNull();
    expect(screen.getByRole("link", { name: "Persetujuan" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Log Audit" })).toBeNull();
    await user.click(await screen.findByRole("button", { name: "Data Induk" }));
    expect(await screen.findByRole("link", { name: "Mata Uang" })).toHaveAttribute(
      "href",
      "/reference",
    );
    expect(screen.getByRole("link", { name: "Pengaturan" })).toHaveAttribute("href", "/settings");
  });
});
