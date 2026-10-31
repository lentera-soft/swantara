import { act } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import { navigationMock, renderHookWithProviders, server } from "@/lib/tests";
import { useRegisterForm } from "../use-register-form";

describe("useRegisterForm submission", () => {
  async function fillValidForm(form: ReturnType<typeof useRegisterForm>["form"]) {
    await act(async () => {
      form.setValue("firstName", "Jane");
      form.setValue("lastName", "Doe");
      form.setValue("email", "new@example.com");
      form.setValue("password", "password1");
      form.setValue("passwordConfirmation", "password1");
    });
  }

  it("registers, logs in and navigates to onboarding", async () => {
    const { result } = renderHookWithProviders(() => useRegisterForm({}));
    await fillValidForm(result.current.form);

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(navigationMock.push).toHaveBeenCalledWith("/onboarding");
  });

  it("sends the phone number when provided", async () => {
    let receivedBody: Record<string, unknown> | undefined;
    server.use(
      http.post("*/api/v1/auth/register", async ({ request }) => {
        receivedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          { success: true, message: "Registration successful." },
          { status: 201 },
        );
      }),
    );
    const { result } = renderHookWithProviders(() => useRegisterForm({}));
    await fillValidForm(result.current.form);
    await act(async () => {
      result.current.form.setValue("phone", "+6281234567890");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(receivedBody).toMatchObject({ phone: "+6281234567890" });
    expect(navigationMock.push).toHaveBeenCalledWith("/onboarding");
  });

  it("omits the phone number when empty", async () => {
    let receivedBody: Record<string, unknown> | undefined;
    server.use(
      http.post("*/api/v1/auth/register", async ({ request }) => {
        receivedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          { success: true, message: "Registration successful." },
          { status: 201 },
        );
      }),
    );
    const { result } = renderHookWithProviders(() => useRegisterForm({}));
    await fillValidForm(result.current.form);

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(receivedBody?.phone).toBeUndefined();
  });

  it("falls back to the login page when auto-login fails", async () => {
    server.use(
      http.post("*/api/v1/auth/login", () =>
        HttpResponse.json({ success: false }, { status: 401 }),
      ),
    );
    const { result } = renderHookWithProviders(() => useRegisterForm({}));
    await fillValidForm(result.current.form);

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(navigationMock.push).toHaveBeenCalledWith("/login");
  });

  it("flags a taken email on a conflict response", async () => {
    server.use(
      http.post("*/api/v1/auth/register", () =>
        HttpResponse.json(
          {
            success: false,
            message: "Email is already registered.",
          },
          { status: 422 },
        ),
      ),
    );
    const { result } = renderHookWithProviders(() => useRegisterForm({}));
    await fillValidForm(result.current.form);

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.form.getFieldState("email").error).toBeDefined();
    expect(navigationMock.push).not.toHaveBeenCalled();
  });

  it("flags a taken phone number", async () => {
    server.use(
      http.post("*/api/v1/auth/register", () =>
        HttpResponse.json(
          {
            success: false,
            message: "Phone is already registered.",
          },
          { status: 422 },
        ),
      ),
    );
    const { result } = renderHookWithProviders(() => useRegisterForm({}));
    await fillValidForm(result.current.form);
    await act(async () => {
      result.current.form.setValue("phone", "+6281234567890");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.form.getFieldState("phone").error).toBeDefined();
    expect(navigationMock.push).not.toHaveBeenCalled();
  });

  it("surfaces a server error toast for a 5xx response", async () => {
    server.use(
      http.post("*/api/v1/auth/register", () =>
        HttpResponse.json({ success: false }, { status: 500 }),
      ),
    );
    const errorSpy = vi.spyOn(toast, "error");
    const { result } = renderHookWithProviders(() => useRegisterForm({}));
    await fillValidForm(result.current.form);

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(errorSpy).toHaveBeenCalled();
  });

  it("surfaces a network error toast when the request fails offline", async () => {
    server.use(http.post("*/api/v1/auth/register", () => HttpResponse.error()));
    const errorSpy = vi.spyOn(toast, "error");
    const { result } = renderHookWithProviders(() => useRegisterForm({}));
    await fillValidForm(result.current.form);

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(errorSpy).toHaveBeenCalled();
  });
});
