import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { navigationMock, renderWithProviders } from "@/lib/tests";
import RegisterForm from "../register-form";

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/nama depan/i), "Jane");
  await user.type(screen.getByLabelText(/nama belakang/i), "Doe");
  await user.type(screen.getByLabelText(/email/i), "new@example.com");
  await user.type(screen.getByLabelText(/telepon/i), "+6281234567890");
  await user.type(screen.getByLabelText(/^kata sandi$/i), "password1");
  await user.type(screen.getByLabelText(/konfirmasi kata sandi/i), "password1");
}

describe("RegisterForm", () => {
  it("renders all fields in a single step", () => {
    renderWithProviders(<RegisterForm />);

    expect(screen.getByLabelText(/nama depan/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nama belakang/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/telepon/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^kata sandi$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/konfirmasi kata sandi/i)).toBeInTheDocument();
  });

  it("registers, logs in and navigates to onboarding", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /daftar/i }));

    await waitFor(() => {
      expect(navigationMock.push).toHaveBeenCalledWith("/onboarding");
    });
  });

  it("blocks submission with inline errors when required fields are empty", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await user.click(screen.getByRole("button", { name: /daftar/i }));

    expect(screen.getByText(/nama depan wajib diisi/i)).toBeInTheDocument();
    expect(navigationMock.push).not.toHaveBeenCalled();
  });

  it("shows a mismatch error when the passwords differ", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await user.type(screen.getByLabelText(/nama depan/i), "Jane");
    await user.type(screen.getByLabelText(/email/i), "new@example.com");
    await user.type(screen.getByLabelText(/^kata sandi$/i), "password1");
    await user.type(screen.getByLabelText(/konfirmasi kata sandi/i), "password2");
    await user.click(screen.getByRole("button", { name: /daftar/i }));

    expect(screen.getByText(/tidak cocok/i)).toBeInTheDocument();
    expect(navigationMock.push).not.toHaveBeenCalled();
  });
});
