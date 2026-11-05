import { describe, expect, it } from "vitest";
import { isProtectedPage } from "../url";

describe("isProtectedPage", () => {
  it("protects app pages", () => {
    expect(isProtectedPage("/onboarding")).toBe(true);
    expect(isProtectedPage("/dashboard")).toBe(true);
    expect(isProtectedPage("/crm/opportunities")).toBe(true);
  });

  it("leaves public pages alone", () => {
    expect(isProtectedPage("/login")).toBe(false);
    expect(isProtectedPage("/register")).toBe(false);
    expect(isProtectedPage("/forgot-password")).toBe(false);
    expect(isProtectedPage("/reset-password")).toBe(false);
    expect(isProtectedPage("/licenses")).toBe(false);
    expect(isProtectedPage("/")).toBe(false);
  });

  it("leaves marketing pages alone", () => {
    expect(isProtectedPage("/product")).toBe(false);
    expect(isProtectedPage("/features")).toBe(false);
    expect(isProtectedPage("/pricing")).toBe(false);
    expect(isProtectedPage("/security")).toBe(false);
    expect(isProtectedPage("/about")).toBe(false);
    expect(isProtectedPage("/careers")).toBe(false);
    expect(isProtectedPage("/contact")).toBe(false);
    expect(isProtectedPage("/guides")).toBe(false);
    expect(isProtectedPage("/changelog")).toBe(false);
    expect(isProtectedPage("/support")).toBe(false);
    expect(isProtectedPage("/privacy")).toBe(false);
    expect(isProtectedPage("/terms")).toBe(false);
    expect(isProtectedPage("/dpa")).toBe(false);
  });
});
