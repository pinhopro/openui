import { describe, expect, it } from "vitest";
import { targetsUnderCell, type MeasuredTarget } from "../../src/mouse/hit-test";
import type { MouseTarget } from "../../src/mouse/mouse-target";

function target(): MouseTarget {
  return { ref: { current: null }, handlers: {} };
}

function measured(
  x: number,
  y: number,
  width: number,
  height: number,
  depth: number,
): MeasuredTarget {
  return { target: target(), rect: { x, y, width, height }, depth };
}

describe("targetsUnderCell", () => {
  it("returns nothing when no rect contains the cell", () => {
    const outer = measured(0, 0, 10, 2, 1);
    expect(targetsUnderCell([outer], 10, 0)).toEqual([]);
    expect(targetsUnderCell([outer], 3, 2)).toEqual([]);
    expect(targetsUnderCell([], 0, 0)).toEqual([]);
  });

  it("returns the one rect that contains the cell", () => {
    const first = measured(0, 0, 10, 1, 1);
    const second = measured(0, 1, 10, 1, 1);
    expect(targetsUnderCell([first, second], 9, 0)).toEqual([first.target]);
    expect(targetsUnderCell([first, second], 0, 1)).toEqual([second.target]);
  });

  it("lists nested boxes innermost first", () => {
    const outer = measured(0, 0, 20, 5, 1);
    const inner = measured(2, 1, 5, 1, 3);
    expect(targetsUnderCell([outer, inner], 3, 1)).toEqual([inner.target, outer.target]);
    expect(targetsUnderCell([inner, outer], 3, 1)).toEqual([inner.target, outer.target]);
    expect(targetsUnderCell([outer, inner], 0, 0)).toEqual([outer.target]);
  });

  it("puts the smaller rect first at the same depth, then the later one", () => {
    const big = measured(0, 0, 20, 5, 2);
    const small = measured(0, 0, 3, 1, 2);
    expect(targetsUnderCell([big, small], 0, 0)).toEqual([small.target, big.target]);
    const twinA = measured(0, 0, 3, 1, 2);
    const twinB = measured(0, 0, 3, 1, 2);
    expect(targetsUnderCell([twinA, twinB], 0, 0)).toEqual([twinB.target, twinA.target]);
  });

  it("ignores rects without a size", () => {
    const empty = measured(0, 0, 0, 0, 5);
    const real = measured(0, 0, 4, 1, 1);
    expect(targetsUnderCell([empty, real], 0, 0)).toEqual([real.target]);
  });
});
