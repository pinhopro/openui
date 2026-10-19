import type { CellRect } from "../focus/element-rect";
import { movedPosition } from "./overlay-placement";
import type { PlacedFrame } from "./overlay-registry";

/** An overlay's offset: cells to the right (`x`) and down (`y`). */
export interface OffsetCells {
  x: number;
  y: number;
}

/** A shown form as its owner last heard of it (`onPlaced`). */
export interface ShownPlacement {
  /** The cells it takes; only its size matters here. */
  rect: CellRect;
  /** How it was placed; null when that is unknown (a cover form). */
  frame: PlacedFrame | null;
}

/**
 * The offset that draws the form exactly where `offset` draws it, with no
 * excess: the part of the offset the host's clamp into the bounds cuts off
 * (`movedPosition`) is dropped, so the next move in the other direction
 * moves the form at once. `offset` itself when nothing is known of the
 * placement, and for no offset unless the form is clamped with none too
 * (`PlacedFrame.alwaysClamped`).
 */
export function drawnOffset(offset: OffsetCells, shown: ShownPlacement | null): OffsetCells {
  if (shown === null || shown.frame === null) return offset;
  const origin = shown.frame.origin;
  const drawn = movedPosition({
    placed: origin,
    offset,
    size: { width: shown.rect.width, height: shown.rect.height },
    bounds: shown.frame.bounds,
    alwaysClamped: shown.frame.alwaysClamped,
  });
  return { x: drawn.x - origin.x, y: drawn.y - origin.y };
}

/**
 * The top-left cell the form is drawn at with `offset` (an offset with no
 * excess, `drawnOffset`); the offset itself when the placement is unknown.
 */
export function drawnTopLeft(offset: OffsetCells, shown: ShownPlacement | null): OffsetCells {
  if (shown === null || shown.frame === null) return offset;
  return { x: shown.frame.origin.x + offset.x, y: shown.frame.origin.y + offset.y };
}

function sameRect(a: CellRect, b: CellRect): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

/**
 * True when an offset draws the form in the same place under both
 * placements: the same origin, the same bounds and a form of the same size
 * (the clamp depends on it). A resize, or an anchor that moved, changes one
 * of them; where the form itself is drawn does not count. Two unknown
 * placements are the same.
 */
export function sameReference(a: ShownPlacement | null, b: ShownPlacement | null): boolean {
  if (a === null || b === null) return a === b;
  if (a.rect.width !== b.rect.width || a.rect.height !== b.rect.height) return false;
  if (a.frame === null || b.frame === null) return a.frame === b.frame;
  if (a.frame.alwaysClamped !== b.frame.alwaysClamped) return false;
  const origin = a.frame.origin;
  const sameOrigin = origin.x === b.frame.origin.x && origin.y === b.frame.origin.y;
  return sameOrigin && sameRect(a.frame.bounds, b.frame.bounds);
}
