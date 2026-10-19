import type { DOMElement } from "ink";
import { elementRect, type CellRect } from "../focus/element-rect";
import { rootRect } from "./root-rect";

type Styles = DOMElement["style"];

/**
 * The cells one border side takes, as Ink lays it out: one when the box has a
 * border style and that side is not turned off, else none.
 */
function borderCells(style: Styles, side: boolean | undefined): number {
  if (!style.borderStyle) return 0;
  return side === false ? 0 : 1;
}

function clipsHorizontally(style: Styles): boolean {
  return (style.overflowX ?? style.overflow) === "hidden";
}

function clipsVertically(style: Styles): boolean {
  return (style.overflowY ?? style.overflow) === "hidden";
}

/**
 * The cells a clipping box lets its children draw in, as Ink clips them: its
 * own cells inside its borders on each axis it hides the overflow of, the
 * whole of `outer` on an axis it does not.
 */
function boxClip(box: DOMElement, outer: CellRect): CellRect {
  const style = box.style;
  const rect = elementRect(box);
  const clip = { ...outer };
  if (clipsHorizontally(style)) {
    clip.x = rect.x + borderCells(style, style.borderLeft);
    clip.width =
      rect.width - borderCells(style, style.borderLeft) - borderCells(style, style.borderRight);
  }
  if (clipsVertically(style)) {
    clip.y = rect.y + borderCells(style, style.borderTop);
    clip.height =
      rect.height - borderCells(style, style.borderTop) - borderCells(style, style.borderBottom);
  }
  return clip;
}

/** The cells two rectangles share; zero wide or high when they share none. */
function intersection(a: CellRect, b: CellRect): CellRect {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  return { x, y, width: Math.max(0, right - x), height: Math.max(0, bottom - y) };
}

/** True when the two rectangles share at least one cell. */
export function rectsIntersect(a: CellRect, b: CellRect): boolean {
  const shared = intersection(a, b);
  return shared.width > 0 && shared.height > 0;
}

/**
 * The cells `element` can be seen in, as clipped by its ancestors with
 * `overflow`, `overflowX` or `overflowY` set to "hidden" (inside their
 * borders, after any scrolling, nested clips intersected), or null when no
 * ancestor clips it. An overlay anchored to an element that shares no cell
 * with this rectangle (a trigger scrolled out of its pane) is not drawn.
 */
export function clippedBy(element: DOMElement): CellRect | null {
  let clip: CellRect | null = null;
  let current: DOMElement | undefined = element.parentNode;
  while (current !== undefined) {
    const style = current.style;
    if (clipsHorizontally(style) || clipsVertically(style)) {
      const box = boxClip(current, rootRect(element));
      clip = clip === null ? box : intersection(clip, box);
    }
    current = current.parentNode;
  }
  return clip;
}
