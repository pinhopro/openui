import { describe, expect, it } from "vitest";
import type { CellRect } from "../../src/focus/element-rect";
import {
  overlayFits,
  placeCompact,
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

  it("keeps a vertical side with more room when neither side fits, cut at the edge, never over its anchor", () => {
    // 8 rows below, 1 above: stays below, its last row past the bounds.
    expect(place(anchorAt(4, 1), "bottom", 0, { width: 10, height: 9 })).toEqual({ x: 4, y: 2 });
    // 2 rows above, 2 below: a tie keeps the asked side.
    const short: CellRect = { x: 0, y: 0, width: 40, height: 5 };
    const tie = { anchor: anchorAt(4, 2), size: SIZE, gap: 0, bounds: short };
    expect(placeOverlay({ ...tie, placement: "bottom" })).toEqual({ x: 4, y: 3 });
    expect(placeOverlay({ ...tie, placement: "top" })).toEqual({ x: 4, y: -1 });
    // 1 row above, 3 below, 4 rows high: a top overlay goes below.
    const low = { anchor: anchorAt(4, 1), size: { width: 10, height: 4 }, gap: 0, bounds: short };
    expect(placeOverlay({ ...low, placement: "top" })).toEqual({ x: 4, y: 2 });
  });

  it("shifts a side overlay that fits neither side inside the bounds, since a row cannot be cut", () => {
    expect(place(anchorAt(17, 2), "right", 0, { width: 20, height: 3 })).toEqual({ x: 20, y: 2 });
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

describe("overlayFits", () => {
  it("says whether a top or bottom overlay fits on either side of its anchor", () => {
    const input = { anchor: anchorAt(4, 4), size: SIZE, gap: 0, bounds: BOUNDS };
    expect(overlayFits({ ...input, placement: "bottom" })).toBe(true);
    expect(overlayFits({ ...input, placement: "top" })).toBe(true);
    const five = { width: 10, height: 5 };
    expect(overlayFits({ ...input, size: five, placement: "top" })).toBe(true);
    const six = { width: 10, height: 6 };
    expect(overlayFits({ ...input, size: six, placement: "bottom" })).toBe(false);
    expect(overlayFits({ ...input, size: six, placement: "top" })).toBe(false);
  });

  it("says whether a left or right overlay is no taller than the bounds", () => {
    const input = { anchor: anchorAt(4, 0), size: SIZE, gap: 1, bounds: BOUNDS };
    expect(overlayFits({ ...input, placement: "right" })).toBe(true);
    const short: CellRect = { x: 0, y: 0, width: 40, height: 2 };
    expect(overlayFits({ ...input, bounds: short, placement: "right" })).toBe(false);
    expect(overlayFits({ ...input, bounds: short, placement: "left" })).toBe(false);
  });

  it("always fits a center overlay", () => {
    const short: CellRect = { x: 0, y: 0, width: 40, height: 1 };
    const input = { anchor: anchorAt(4, 0), size: SIZE, gap: 0, bounds: short };
    expect(overlayFits({ ...input, placement: "center" })).toBe(true);
  });
});

describe("placeCompact", () => {
  const LABEL: OverlaySize = { width: 8, height: 1 };

  it("puts a compact overlay one cell right of its anchor, on its row", () => {
    const placed = placeCompact({ anchor: anchorAt(4, 2), size: LABEL, bounds: BOUNDS });
    expect(placed).toEqual({ x: 11, y: 2 });
  });

  it("puts it one cell left of its anchor when the right has no room", () => {
    const placed = placeCompact({ anchor: anchorAt(30, 2), size: LABEL, bounds: BOUNDS });
    expect(placed).toEqual({ x: 21, y: 2 });
  });

  it("puts it under its anchor when neither side has room, over it on the last row", () => {
    const narrow: CellRect = { x: 0, y: 0, width: 16, height: 10 };
    expect(placeCompact({ anchor: anchorAt(5, 2), size: LABEL, bounds: narrow })).toEqual({
      x: 5,
      y: 3,
    });
    expect(placeCompact({ anchor: anchorAt(5, 9), size: LABEL, bounds: narrow })).toEqual({
      x: 5,
      y: 8,
    });
  });
});
