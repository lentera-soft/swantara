import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmailInput } from "@/components/email-input";
import { renderWithProviders } from "@/lib/tests";

describe("EmailInput", () => {
  it("renders an email input with the @ prefix and data-slot", () => {
    renderWithProviders(<EmailInput aria-label="Email" />);

    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toHaveAttribute("data-slot", "input-group-control");
    expect(input).toHaveAttribute("type", "email");
    expect(input.closest("[data-slot='email-input']")).not.toBeNull();
    expect(screen.getByText("@")).toBeInTheDocument();
  });

  it("accepts typing and forwards change events", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<EmailInput aria-label="Email" value="" onChange={onChange} />);

    await user.type(screen.getByRole("textbox", { name: "Email" }), "a@b.co");

    expect(onChange).toHaveBeenCalled();
  });

  it("is disabled via the disabled attribute", () => {
    renderWithProviders(<EmailInput aria-label="Email" disabled />);

    expect(screen.getByRole("textbox", { name: "Email" })).toBeDisabled();
  });
});
