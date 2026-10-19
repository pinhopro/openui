import { describe, expect, it } from "vitest";
import type { CellRect } from "../../src/focus/element-rect";
import {
  clampIntoBounds,
  compactWidthLimit,
  overlayFits,
  placeCompact,
  placeOverlay,
  rowsMissingBelow,
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

  it("puts a cover overlay at the bounds' top-left, whatever its anchor and size", () => {
    const inset = { x: 10, y: 5, width: 20, height: 6 };
    // The size is never used: a cover box is as large as the bounds.
    const size = { width: 4, height: 2 };
    expect(
      placeOverlay({ anchor: anchorAt(30, 9), size, placement: "cover", gap: 2, bounds: inset }),
    ).toEqual({ x: 10, y: 5 });
    expect(place(anchorAt(4, 2), "cover", 0, size)).toEqual({ x: 0, y: 0 });
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

  it("needs horizontal room on one side of the anchor for a left or right overlay", () => {
    // 16 columns, anchor at 5..10, gap 1: 4 free cells left of it, 4 right of it; the box is 10 wide.
    const narrow: CellRect = { x: 0, y: 0, width: 16, height: 10 };
    const input = { anchor: anchorAt(5, 2), size: SIZE, gap: 1, bounds: narrow };
    expect(overlayFits({ ...input, placement: "right" })).toBe(false);
    expect(overlayFits({ ...input, placement: "left" })).toBe(false);
    // Anchor at 14..19 in 22 columns, gap 1: 13 free cells left of it, 1 right of it.
    const roomLeft: CellRect = { x: 0, y: 0, width: 22, height: 10 };
    const pushed = { anchor: anchorAt(14, 2), size: SIZE, gap: 1, bounds: roomLeft };
    expect(overlayFits({ ...pushed, placement: "right" })).toBe(true);
    expect(overlayFits({ ...pushed, placement: "left" })).toBe(true);
  });

  it("always fits a center overlay", () => {
    const short: CellRect = { x: 0, y: 0, width: 40, height: 1 };
    const input = { anchor: anchorAt(4, 0), size: SIZE, gap: 0, bounds: short };
    expect(overlayFits({ ...input, placement: "center" })).toBe(true);
  });

  it("always fits a cover overlay", () => {
    const short: CellRect = { x: 0, y: 0, width: 40, height: 1 };
    const input = { anchor: anchorAt(4, 0), size: { width: 40, height: 1 }, gap: 0, bounds: short };
    expect(overlayFits({ ...input, placement: "cover" })).toBe(true);
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

describe("compactWidthLimit", () => {
  it("is the room right of the anchor (after the one-cell gap) when that side is the wider", () => {
    // Anchor cells 4..9; the right side holds cells 11..39.
    expect(compactWidthLimit({ anchor: anchorAt(4, 2), bounds: BOUNDS })).toBe(29);
  });

  it("is the room left of the anchor when that side is the wider", () => {
    // Anchor cells 30..35; the left side holds cells 0..28.
    expect(compactWidthLimit({ anchor: anchorAt(30, 2), bounds: BOUNDS })).toBe(29);
  });

  it("is the bounds' width when neither side holds eight cells", () => {
    const narrow: CellRect = { x: 0, y: 0, width: 16, height: 10 };
    expect(compactWidthLimit({ anchor: anchorAt(5, 2), bounds: narrow })).toBe(16);
  });
});

describe("rowsMissingBelow", () => {
  /** The rows BOUNDS lack for an overlay of `size` at `placement` against `anchor`. */
  function missing(anchor: CellRect, placement: OverlayPlacement, size: OverlaySize): number {
    return rowsMissingBelow({ anchor, size, placement, gap: 0, bounds: BOUNDS });
  }

  it("is 0 for an overlay that fits, on its side or the opposite one", () => {
    expect(missing(anchorAt(4, 2), "bottom", SIZE)).toBe(0);
    // No room under the last row, room above it: it flips, nothing is missing.
    expect(missing(anchorAt(4, 9), "bottom", SIZE)).toBe(0);
    expect(missing(anchorAt(4, 2), "center", SIZE)).toBe(0);
  });

  it("is the rows a top or bottom overlay that fits neither side reaches past the bounds under its anchor", () => {
    // 9 rows fit neither over row 8 nor under it, where they take rows 9..17: 8 past the 10 rows.
    expect(missing(anchorAt(4, 8), "bottom", { width: 10, height: 9 })).toBe(8);
    // 7 rows fit neither over row 5 nor under it (rows 6..12): 3 past.
    expect(missing(anchorAt(4, 5), "top", { width: 10, height: 7 })).toBe(3);
  });

  it("is the rows a center, left or right overlay is taller than the bounds", () => {
    const tall: OverlaySize = { width: 10, height: 14 };
    expect(missing(anchorAt(4, 2), "center", tall)).toBe(4);
    expect(missing(anchorAt(4, 2), "right", tall)).toBe(4);
    expect(missing(anchorAt(30, 2), "left", tall)).toBe(4);
  });

  it("is 0 for a cover overlay, which spans the bounds", () => {
    expect(missing(anchorAt(4, 2), "cover", { width: 40, height: 30 })).toBe(0);
  });
});

describe("clampIntoBounds", () => {
  const bounds: CellRect = { x: 2, y: 1, width: 40, height: 10 };

  it("keeps a box that lies inside the bounds where it is", () => {
    expect(clampIntoBounds({ x: 5, y: 3 }, SIZE, bounds)).toEqual({ x: 5, y: 3 });
  });

  it("shifts a box past the right edge left so it ends at the last column", () => {
    // The last column is 41: a 10-cell box starts at 32.
    expect(clampIntoBounds({ x: 38, y: 3 }, SIZE, bounds)).toEqual({ x: 32, y: 3 });
  });

  it("shifts a box past the bottom edge up so it ends at the last row", () => {
    // The last row is 10: a 3-row box starts at 8.
    expect(clampIntoBounds({ x: 5, y: 9 }, SIZE, bounds)).toEqual({ x: 5, y: 8 });
  });

  it("shifts a box past the top-left edges into the bounds", () => {
    expect(clampIntoBounds({ x: -4, y: -2 }, SIZE, bounds)).toEqual({ x: 2, y: 1 });
  });

  it("puts a box larger than the bounds at their origin", () => {
    expect(clampIntoBounds({ x: 9, y: 4 }, { width: 50, height: 12 }, bounds)).toEqual({
      x: 2,
      y: 1,
    });
  });
});
