import { describe, expect, it } from "vitest";
import { drawnOffset, drawnTopLeft, type ShownPlacement } from "../../src/overlay/drawn-offset";

/** A 10 by 4 form placed at (20, 5) in 40 by 12 bounds. */
const SHOWN: ShownPlacement = {
  rect: { x: 20, y: 5, width: 10, height: 4 },
  frame: { origin: { x: 20, y: 5 }, bounds: { x: 0, y: 0, width: 40, height: 12 } },
};

describe("drawnOffset", () => {
  it("keeps an offset the bounds do not cut", () => {
    expect(drawnOffset({ x: 3, y: -2 }, SHOWN)).toEqual({ x: 3, y: -2 });
  });

  it("drops the excess past the right and bottom edges", () => {
    // The form ends at the last column (x 30 to 39) and the last row (y 8 to 11).
    expect(drawnOffset({ x: 50, y: 9 }, SHOWN)).toEqual({ x: 10, y: 3 });
  });

  it("drops the excess past the left and top edges", () => {
    expect(drawnOffset({ x: -30, y: -9 }, SHOWN)).toEqual({ x: -20, y: -5 });
  });

  it("is the offset itself when the placement is unknown, and for no offset", () => {
    expect(drawnOffset({ x: 50, y: 0 }, null)).toEqual({ x: 50, y: 0 });
    expect(drawnOffset({ x: 50, y: 0 }, { rect: SHOWN.rect, frame: null })).toEqual({
      x: 50,
      y: 0,
    });
    expect(drawnOffset({ x: 0, y: 0 }, SHOWN)).toEqual({ x: 0, y: 0 });
  });
});

describe("drawnTopLeft", () => {
  it("is the placed origin moved by the offset, or the offset when the placement is unknown", () => {
    expect(drawnTopLeft({ x: 3, y: 1 }, SHOWN)).toEqual({ x: 23, y: 6 });
    expect(drawnTopLeft({ x: 3, y: 1 }, null)).toEqual({ x: 3, y: 1 });
  });
});
