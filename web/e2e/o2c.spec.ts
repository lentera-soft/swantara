import { expect, test } from "@playwright/test";

import { navigateToOrg, seedOrg } from "./fixtures/helpers";

test.describe("Order-to-Cash (O2C) flow", () => {
  test.beforeEach(async ({ page }) => {
    await seedOrg(page);
  });

  test("navigates through O2C screens", async ({ page }) => {
    await navigateToOrg(page, "/crm");
    await expect(page.getByRole("main").first()).toBeVisible();
    await expect(page.getByRole("heading")).toBeVisible();

    await navigateToOrg(page, "/sale-orders");
    await expect(page.getByRole("main").first()).toBeVisible();
    await expect(page.getByRole("heading")).toBeVisible();

    await navigateToOrg(page, "/invoices");
    await expect(page.getByRole("main").first()).toBeVisible();

    await navigateToOrg(page, "/payments");
    await expect(page.getByRole("main").first()).toBeVisible();
  });

  test("CRM pages are reachable from the sidebar", async ({ page }) => {
    await navigateToOrg(page, "/crm");
    await expect(page.getByRole("main").first()).toBeVisible();
    await expect(page.locator('a[href="/crm/leads"]').first()).toBeVisible();
    await expect(page.locator('a[href="/crm/opportunities"]').first()).toBeVisible();
    await expect(page.locator('a[href="/crm/activities"]').first()).toBeVisible();
  });

  test("sale orders page has create button or empty state", async ({ page }) => {
    await navigateToOrg(page, "/sale-orders");
    await expect(page.getByRole("main").first()).toBeVisible();
    const hasCreateBtn = await page
      .getByRole("button", { name: /create|add/i })
      .first()
      .isVisible()
      .catch(() => false);
    const hasEmptyState = await page
      .getByText(/no.*found|empty/i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasCreateBtn || hasEmptyState).toBe(true);
  });
});
