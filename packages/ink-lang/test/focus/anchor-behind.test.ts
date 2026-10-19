import { describe, expect, it } from "vitest";
import { anchorBehind } from "../../src/focus/anchor-behind";
import type { FocusStop } from "../../src/focus/focus-order";

const NO_ARROWS = { up: false, down: false, left: false, right: false };

/** A stop `id` taking `width` by `height` cells at (`x`, `y`), on the base unless `overlay` is given. */
function stop(
  id: string,
  rect: { x: number; y: number; width: number; height: number },
  overlay: string | null = null,
): FocusStop {
  return {
    id,
    component: "Button",
    name: id,
    program: 0,
    path: [0],
    rect,
    arrows: NO_ARROWS,
    overlay,
    layer: overlay ?? "base",
    anchor: null,
  };
}

/** Two rows: A and B side by side on row 2, C alone on row 5 (listed out of reading order). */
const STOPS: FocusStop[] = [
  stop("c", { x: 4, y: 5, width: 5, height: 1 }),
  stop("a", { x: 0, y: 2, width: 5, height: 1 }),
  stop("b", { x: 10, y: 2, width: 5, height: 1 }),
];

describe("anchorBehind", () => {
  it("is the stop whose rectangle contains the cell", () => {
    expect(anchorBehind({ x: 12, y: 2 }, STOPS)).toBe("b");
    expect(anchorBehind({ x: 4, y: 5 }, STOPS)).toBe("c");
  });

  it("is the stop before the cell on its row, in the gap after it", () => {
    expect(anchorBehind({ x: 7, y: 2 }, STOPS)).toBe("a");
    expect(anchorBehind({ x: 30, y: 2 }, STOPS)).toBe("b");
  });

  it("is the last stop in reading order on a row above the cell", () => {
    expect(anchorBehind({ x: 0, y: 3 }, STOPS)).toBe("b");
    expect(anchorBehind({ x: 0, y: 5 }, STOPS)).toBe("b");
    expect(anchorBehind({ x: 50, y: 40 }, STOPS)).toBe("c");
  });

  it("is null above the first stop, and with no stops", () => {
    expect(anchorBehind({ x: 0, y: 0 }, STOPS)).toBeNull();
    expect(anchorBehind({ x: 0, y: 2 }, [])).toBeNull();
  });

  it("only counts stops on the base, never an overlay's", () => {
    const covered = STOPS.concat(stop("close", { x: 0, y: 3, width: 9, height: 1 }, "dialog"));
    expect(anchorBehind({ x: 2, y: 3 }, covered)).toBe("b");
    expect(
      anchorBehind({ x: 0, y: 0 }, [stop("close", { x: 0, y: 0, width: 9, height: 1 }, "dialog")]),
    ).toBeNull();
  });
});
