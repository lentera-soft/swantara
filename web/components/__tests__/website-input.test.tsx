import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WebsiteInput } from "@/components/website-input";
import { renderWithProviders } from "@/lib/tests";

describe("WebsiteInput", () => {
  it("renders a url input with the https:// prefix and data-slot", () => {
    renderWithProviders(<WebsiteInput aria-label="Website" />);

    const input = screen.getByRole("textbox", { name: "Website" });
    expect(input).toHaveAttribute("data-slot", "input-group-control");
    expect(input).toHaveAttribute("type", "url");
    expect(input.closest("[data-slot='website-input']")).not.toBeNull();
    expect(screen.getByText("https://")).toBeInTheDocument();
  });

  it("falls back to the example.com placeholder", () => {
    renderWithProviders(<WebsiteInput aria-label="Website" />);

    expect(screen.getByPlaceholderText("example.com")).toBeInTheDocument();
  });

  it("accepts typing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<WebsiteInput aria-label="Website" value="" onChange={onChange} />);

    await user.type(screen.getByRole("textbox", { name: "Website" }), "acme.co");

    expect(onChange).toHaveBeenCalled();
  });
});
