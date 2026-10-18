import { describe, expect, it } from "vitest";
import { sliderValueAtCell } from "../../src/components/slider-track";

describe("sliderValueAtCell", () => {
  it("maps the pointer's cell on the track to a value snapped to the step", () => {
    expect(sliderValueAtCell(1, 22, 0, 100, 1)).toBe(0);
    expect(sliderValueAtCell(20, 22, 0, 100, 1)).toBe(100);
    expect(sliderValueAtCell(11, 22, 0, 100, 1)).toBe(53);
    expect(sliderValueAtCell(11, 22, 0, 10, 2)).toBe(6);
  });

  it("clamps cells before the track start and past its end", () => {
    expect(sliderValueAtCell(-5, 22, 0, 100, 1)).toBe(0);
    expect(sliderValueAtCell(0, 22, 0, 100, 1)).toBe(0);
    expect(sliderValueAtCell(40, 22, 0, 100, 1)).toBe(100);
  });
});
