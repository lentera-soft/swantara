import { screen } from "@testing-library/react";
import { Layers, LayoutDashboard, Package } from "lucide-react";
import { describe, expect, it } from "vitest";
import { SidebarProvider } from "@/components/app-shell";
import { navigationMock, renderWithProviders } from "@/lib/tests";
import type { OrgNavItem } from "../nav-items";
import { SidebarTree } from "../sidebar-tree";

const ITEMS: OrgNavItem[] = [
  {
    key: "dashboard",
    group: "overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "items",
    group: "modules",
    module: "inventory",
    href: "/products",
    icon: Package,
  },
  {
    key: "recipes",
    group: "modules",
    module: "production",
    href: "/products/recipes",
    icon: Layers,
  },
];

function renderTree(props: Partial<React.ComponentProps<typeof SidebarTree>> = {}) {
  return renderWithProviders(
    <SidebarProvider>
      <SidebarTree items={ITEMS} {...props} />
    </SidebarProvider>,
  );
}

describe("SidebarTree", () => {
  it("renders every link flat without nested submenus", () => {
    renderTree();

    expect(screen.getByRole("link", { name: "Dasbor" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Barang" })).toHaveAttribute("href", "/products");
    expect(screen.getByRole("link", { name: "Resep" })).toHaveAttribute(
      "href",
      "/products/recipes",
    );
  });

  it("marks the link matching the current pathname as active", () => {
    navigationMock.setPathname("/dashboard");
    renderTree();

    expect(screen.getByRole("link", { name: "Dasbor" })).toHaveAttribute("data-active", "true");
    expect(screen.getByRole("link", { name: "Barang" })).toHaveAttribute("data-active", "false");
  });

  it("highlights only the most specific matching route", () => {
    navigationMock.setPathname("/products/recipes");
    renderTree();

    expect(screen.getByRole("link", { name: "Barang" })).toHaveAttribute("data-active", "false");
    expect(screen.getByRole("link", { name: "Resep" })).toHaveAttribute("data-active", "true");
    expect(screen.getByRole("link", { name: "Resep" })).toHaveAttribute("aria-current", "page");
  });

  it("renders items in definition order", () => {
    renderTree();

    const links = screen.getAllByRole("link").map((link) => link.textContent);
    expect(links.indexOf("Dasbor")).toBeLessThan(links.indexOf("Barang"));
  });
});
