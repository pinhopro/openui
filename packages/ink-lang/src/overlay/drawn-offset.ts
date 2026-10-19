import type { CellRect } from "../focus/element-rect";
import { clampIntoBounds } from "./overlay-placement";
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
 * (`clampIntoBounds`) is dropped, so the next move in the other direction
 * moves the form at once. `offset` itself when nothing is known of the
 * placement, and for no offset (the host never clamps that one).
 */
export function drawnOffset(offset: OffsetCells, shown: ShownPlacement | null): OffsetCells {
  if (shown === null || shown.frame === null) return offset;
  if (offset.x === 0 && offset.y === 0) return offset;
  const origin = shown.frame.origin;
  const size = { width: shown.rect.width, height: shown.rect.height };
  const moved = { x: origin.x + offset.x, y: origin.y + offset.y };
  const drawn = clampIntoBounds(moved, size, shown.frame.bounds);
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
