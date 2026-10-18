import { measureElement, type DOMElement } from "ink";

/** A rectangle of terminal cells, 0-based. */
export interface CellRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Offset {
  x: number;
  y: number;
}

function contentOffset(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.trunc(value);
}

/**
 * How far the ancestors' `contentOffsetX` / `contentOffsetY` (scrolled
 * containers) move the element on screen: Ink's layout metrics leave those
 * out, the terminal cells do not.
 */
function scrolledOffset(element: DOMElement): Offset {
  const offset: Offset = { x: 0, y: 0 };
  let current: DOMElement | undefined = element.parentNode;
  while (current !== undefined) {
    offset.x += contentOffset(current.style.contentOffsetX);
    offset.y += contentOffset(current.style.contentOffsetY);
    current = current.parentNode;
  }
  return offset;
}

/** The cells an element occupies on screen, after any scrolling by its ancestors. */
export function elementRect(element: DOMElement): CellRect {
  const metrics = measureElement(element);
  const scrolled = scrolledOffset(element);
  return {
    x: metrics.x - scrolled.x,
    y: metrics.y - scrolled.y,
    width: metrics.width,
    height: metrics.height,
  };
}
