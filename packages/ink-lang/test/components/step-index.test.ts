import { describe, expect, it } from "vitest";
import { clampIndex, stepIndex } from "../../src/components/step-index";

describe("clampIndex", () => {
  it("keeps an index inside the list", () => {
    expect(clampIndex(1, 3)).toBe(1);
    expect(clampIndex(-2, 3)).toBe(0);
    expect(clampIndex(7, 3)).toBe(2);
  });

  it("is zero for an empty list", () => {
    expect(clampIndex(4, 0)).toBe(0);
  });
});

describe("stepIndex", () => {
  it("moves by the delta", () => {
    expect(stepIndex(0, 3, 1)).toBe(1);
    expect(stepIndex(2, 3, -1)).toBe(1);
  });

  it("stops at both ends instead of wrapping", () => {
    expect(stepIndex(2, 3, 1)).toBe(2);
    expect(stepIndex(0, 3, -1)).toBe(0);
  });
});
