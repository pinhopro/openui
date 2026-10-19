import type { CellRect } from "../focus/element-rect";

/** Where an overlay goes relative to its anchor; `center` centres it in the bounds. */
export type OverlayPlacement = "top" | "bottom" | "left" | "right" | "center";

export interface OverlaySize {
  width: number;
  height: number;
}

export interface OverlayPosition {
  x: number;
  y: number;
}

export interface PlaceOverlayInput {
  /** The cells of the element the overlay is attached to. */
  anchor: CellRect;
  /** The overlay box's size; never shrunk. */
  size: OverlaySize;
  placement: OverlayPlacement;
  /** Empty cells between the anchor and the overlay. */
  gap: number;
  /** The rectangle the overlay must stay in (the ink root). */
  bounds: CellRect;
}

/** The side opposite to `placement`; `center` has none. */
function oppositeOf(placement: OverlayPlacement): OverlayPlacement {
  if (placement === "top") return "bottom";
  if (placement === "bottom") return "top";
  if (placement === "left") return "right";
  if (placement === "right") return "left";
  return "center";
}

/** The top-left cell of the overlay on one side of its anchor, before any flip or shift. */
function sidePosition(input: PlaceOverlayInput, placement: OverlayPlacement): OverlayPosition {
  const anchor = input.anchor;
  const size = input.size;
  const bounds = input.bounds;
  if (placement === "bottom") return { x: anchor.x, y: anchor.y + anchor.height + input.gap };
  if (placement === "top") return { x: anchor.x, y: anchor.y - size.height - input.gap };
  if (placement === "right") return { x: anchor.x + anchor.width + input.gap, y: anchor.y };
  if (placement === "left") return { x: anchor.x - size.width - input.gap, y: anchor.y };
  return {
    x: bounds.x + Math.floor((bounds.width - size.width) / 2),
    y: bounds.y + Math.floor((bounds.height - size.height) / 2),
  };
}

/** True when the overlay at `position` does not cross the bounds on the side it was placed. */
function fitsSide(
  input: PlaceOverlayInput,
  placement: OverlayPlacement,
  position: OverlayPosition,
): boolean {
  const bounds = input.bounds;
  if (placement === "bottom") return position.y + input.size.height <= bounds.y + bounds.height;
  if (placement === "top") return position.y >= bounds.y;
  if (placement === "right") return position.x + input.size.width <= bounds.x + bounds.width;
  if (placement === "left") return position.x >= bounds.x;
  return true;
}

/** Moves `start` so a box of `length` cells lies in [min, min + room); at `min` when it is longer. */
function shiftInto(start: number, length: number, min: number, room: number): number {
  const max = min + room - length;
  return Math.max(min, Math.min(start, max));
}

/**
 * The top-left cell of an overlay: on the asked side of its anchor, flipped to
 * the opposite side when it does not fit there and the opposite side does,
 * then shifted (never shrunk) so it lies inside the bounds.
 */
export function placeOverlay(input: PlaceOverlayInput): OverlayPosition {
  let position = sidePosition(input, input.placement);
  if (!fitsSide(input, input.placement, position)) {
    const opposite = oppositeOf(input.placement);
    const flipped = sidePosition(input, opposite);
    if (fitsSide(input, opposite, flipped)) position = flipped;
  }
  const bounds = input.bounds;
  return {
    x: shiftInto(position.x, input.size.width, bounds.x, bounds.width),
    y: shiftInto(position.y, input.size.height, bounds.y, bounds.height),
  };
}
