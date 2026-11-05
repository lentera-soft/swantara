import { describe, expect, it } from "vitest";
import { ensureHttpsUrl, stripUrlScheme } from "../customer-form-utils";

describe("stripUrlScheme", () => {
  it("removes leading http/https or protocol slashes", () => {
    expect(stripUrlScheme("https://acme.co")).toBe("acme.co");
    expect(stripUrlScheme("http://acme.co")).toBe("acme.co");
    expect(stripUrlScheme("//acme.co")).toBe("acme.co");
    expect(stripUrlScheme("acme.co")).toBe("acme.co");
    expect(stripUrlScheme("")).toBe("");
  });
});

describe("ensureHttpsUrl", () => {
  it("adds https to a bare host", () => {
    expect(ensureHttpsUrl("acme.co")).toBe("https://acme.co");
  });

  it("keeps an explicit scheme", () => {
    expect(ensureHttpsUrl("http://acme.co")).toBe("http://acme.co");
  });

  it("returns null for empty input", () => {
    expect(ensureHttpsUrl("   ")).toBeNull();
  });
});
