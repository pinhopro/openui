import { describe, expect, it } from "vitest";
import type { CellRect } from "../../src/focus/element-rect";
import {
  placeOverlay,
  type OverlayPlacement,
  type OverlayPosition,
  type OverlaySize,
} from "../../src/overlay/overlay-placement";

const BOUNDS: CellRect = { x: 0, y: 0, width: 40, height: 10 };
const SIZE: OverlaySize = { width: 10, height: 3 };

/** An anchor one row high and 6 cells wide at a cell. */
function anchorAt(x: number, y: number): CellRect {
  return { x, y, width: 6, height: 1 };
}

/** Places an overlay inside BOUNDS. */
function place(
  anchor: CellRect,
  placement: OverlayPlacement,
  gap: number,
  size: OverlaySize = SIZE,
): OverlayPosition {
  return placeOverlay({ anchor, size, placement, gap, bounds: BOUNDS });
}

describe("placeOverlay", () => {
  it("places a bottom overlay under its anchor, at the anchor's column", () => {
    expect(
      placeOverlay({
        anchor: { x: 4, y: 2, width: 6, height: 1 },
        size: { width: 10, height: 3 },
        placement: "bottom",
        gap: 0,
        bounds: { x: 0, y: 0, width: 40, height: 10 },
      }),
    ).toEqual({ x: 4, y: 3 });
  });

  it("leaves the gap between the anchor and the overlay on every side", () => {
    expect(place(anchorAt(4, 4), "bottom", 1)).toEqual({ x: 4, y: 6 });
    expect(place(anchorAt(4, 4), "top", 1)).toEqual({ x: 4, y: 0 });
    expect(place(anchorAt(4, 4), "right", 1)).toEqual({ x: 11, y: 4 });
    expect(place(anchorAt(20, 4), "left", 1)).toEqual({ x: 9, y: 4 });
  });

  it("flips a top overlay with no room above to below its anchor", () => {
    expect(place(anchorAt(4, 1), "top", 0)).toEqual({ x: 4, y: 2 });
  });

  it("flips a bottom overlay with no room below to above its anchor", () => {
    expect(place(anchorAt(4, 8), "bottom", 0)).toEqual({ x: 4, y: 5 });
  });

  it("flips a right overlay at the right edge to the left of its anchor", () => {
    expect(place(anchorAt(30, 2), "right", 0)).toEqual({ x: 20, y: 2 });
  });

  it("flips a left overlay at the left edge to the right of its anchor", () => {
    expect(place(anchorAt(2, 2), "left", 0)).toEqual({ x: 8, y: 2 });
  });

  it("shifts a box wider than the room to x = 0, without shrinking it", () => {
    expect(place(anchorAt(4, 2), "bottom", 0, { width: 50, height: 3 })).toEqual({ x: 0, y: 3 });
  });

  it("shifts a box past the right edge back inside the bounds", () => {
    expect(place(anchorAt(34, 2), "bottom", 0)).toEqual({ x: 30, y: 3 });
  });

  it("keeps the side when neither side fits, shifted inside the bounds", () => {
    expect(place(anchorAt(4, 1), "bottom", 0, { width: 10, height: 9 })).toEqual({ x: 4, y: 1 });
  });

  it("centres a center overlay in the bounds", () => {
    const size = { width: 10, height: 4 };
    expect(place(anchorAt(4, 2), "center", 0, size)).toEqual({ x: 15, y: 3 });
    const inset = { x: 10, y: 5, width: 20, height: 6 };
    expect(
      placeOverlay({ anchor: anchorAt(4, 2), size, placement: "center", gap: 0, bounds: inset }),
    ).toEqual({ x: 15, y: 6 });
  });
});
