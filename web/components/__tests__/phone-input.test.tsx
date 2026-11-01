import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PhoneInput } from "@/components/phone-input";

describe("PhoneInput", () => {
  it("renders the design system control recipe on the group root", () => {
    const { container } = render(<PhoneInput />);

    const group = screen.getByRole("group");

    expect(group).toHaveAttribute("data-slot", "phone-input");
    expect(group.className).toContain("h-11");
    expect(group.className).toContain("border-input");
    expect(group.className).toContain("rounded-lg");
    expect(container.querySelector(".PhoneInputCountry")).toBeTruthy();
  });

  it("exposes the phone field as an input group control", () => {
    render(<PhoneInput id="phone" placeholder="+6281234567890" />);

    const input = screen.getByRole("textbox");

    expect(input).toHaveAttribute("data-slot", "input-group-control");
    expect(input).toHaveAttribute("id", "phone");
    expect(input).toHaveAttribute("type", "tel");
    expect(input).toHaveAttribute("placeholder", "+6281234567890");
  });

  it("labels the country select for assistive technology", () => {
    render(<PhoneInput />);

    expect(screen.getByRole("combobox", { name: "Country code" })).toHaveAttribute(
      "data-slot",
      "phone-input-country",
    );
  });

  it("forwards state attributes to the control", () => {
    render(<PhoneInput disabled aria-invalid />);

    const input = screen.getByRole("textbox");

    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("emits the parsed phone number on change", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PhoneInput onChange={onChange} />);

    await user.type(screen.getByRole("textbox"), "81234567890");

    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)?.[0]).toContain("81234567890");
  });
});
