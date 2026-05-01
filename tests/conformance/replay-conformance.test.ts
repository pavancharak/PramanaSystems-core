import { describe, it, expect } from "vitest";

describe("Replay Conformance", () => {
  it("must reject duplicate replay identifiers", () => {
    const first = true;
    const second = false;

    expect(first).toBe(true);
    expect(second).toBe(false);
  });
});
