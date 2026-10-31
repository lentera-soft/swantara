import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { setAppLocale } from "@/lib/i18n/actions";
import { navigationMock, renderWithProviders } from "@/lib/tests";

vi.mock("@/lib/i18n/actions", () => ({
  setAppLocale: vi.fn(async () => {}),
}));

describe("LocaleSwitcher", () => {
  it("persists the selected locale and refreshes the page", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LocaleSwitcher />);

    await user.click(screen.getByRole("button", { name: "Bahasa" }));
    await user.click(await screen.findByRole("menuitem", { name: "English" }));

    await waitFor(() => expect(setAppLocale).toHaveBeenCalledWith("en"));
    expect(navigationMock.refresh).toHaveBeenCalled();
  });
});
