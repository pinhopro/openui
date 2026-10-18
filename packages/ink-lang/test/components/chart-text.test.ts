import { describe, expect, it } from "vitest";
import {
  barCells,
  formatNumber,
  percentages,
  proportionSegments,
  sparkline,
} from "../../src/components/chart-text";

describe("barCells", () => {
  it("scales the value to the width and keeps a non-zero value visible", () => {
    expect(barCells(10, 10, 10)).toBe(10);
    expect(barCells(5, 10, 10)).toBe(5);
    expect(barCells(0.1, 10, 10)).toBe(1);
    expect(barCells(0, 10, 10)).toBe(0);
    expect(barCells(5, 0, 10)).toBe(0);
  });
});

describe("sparkline", () => {
  it("maps values onto the eight block glyphs", () => {
    expect(sparkline([0, 10])).toBe("▁█");
    expect(sparkline([0, 5, 10])).toBe("▁▅█");
  });

  it("draws a flat line for constant values and nothing for no values", () => {
    expect(sparkline([5, 5, 5])).toBe("▄▄▄");
    expect(sparkline([])).toBe("");
  });
});

describe("percentages", () => {
  it("rounds shares of the total to whole percents", () => {
    expect(percentages([1, 3])).toEqual([25, 75]);
    expect(percentages([0, 0])).toEqual([0, 0]);
  });
});

describe("proportionSegments", () => {
  it("splits the width proportionally and gives every non-empty slice at least one cell", () => {
    expect(proportionSegments([1, 3], 8)).toEqual([2, 6]);
    expect(proportionSegments([1, 99], 10)).toEqual([1, 9]);
    expect(proportionSegments([0, 4], 4)).toEqual([0, 4]);
  });
});

describe("formatNumber", () => {
  it("keeps integers short and rounds decimals to two places", () => {
    expect(formatNumber(12)).toBe("12");
    expect(formatNumber(12.345)).toBe("12.35");
    expect(formatNumber(1234567)).toBe("1234567");
  });
});
