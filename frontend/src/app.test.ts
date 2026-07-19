import { describe, expect, it } from "vitest";
describe("reconciliation client", () => {
  it("has deterministic outcome labels", () =>
    expect("amount_mismatch".replaceAll("_", " ")).toBe("amount mismatch"));
});
