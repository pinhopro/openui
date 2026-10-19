import type { CellRect } from "../focus/element-rect";

/**
 * Where an overlay goes relative to its anchor; `center` centres it in the
 * bounds; `cover` spans the bounds (a backdrop), at their top-left.
 */
export type OverlayPlacement = "top" | "bottom" | "left" | "right" | "center" | "cover";

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

/** The side opposite to `placement`; `center` and `cover` have none and are their own. */
function oppositeOf(placement: OverlayPlacement): OverlayPlacement {
  if (placement === "top") return "bottom";
  if (placement === "bottom") return "top";
  if (placement === "left") return "right";
  if (placement === "right") return "left";
  return placement;
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
  if (placement === "cover") return { x: bounds.x, y: bounds.y };
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

/** The cells between the anchor (plus the gap) and the edge of the bounds on one side. */
function roomOnSide(input: PlaceOverlayInput, placement: OverlayPlacement): number {
  const anchor = input.anchor;
  const bounds = input.bounds;
  if (placement === "bottom")
    return bounds.y + bounds.height - (anchor.y + anchor.height + input.gap);
  if (placement === "top") return anchor.y - input.gap - bounds.y;
  if (placement === "right") return bounds.x + bounds.width - (anchor.x + anchor.width + input.gap);
  if (placement === "left") return anchor.x - input.gap - bounds.x;
  return 0;
}

/**
 * The side the overlay goes on: the asked one when it fits, else the opposite
 * one when that fits. When neither fits, a top or bottom overlay takes the
 * side with more room (the asked one on a tie); a left or right one keeps the
 * asked side.
 */
function chooseSide(input: PlaceOverlayInput): OverlayPlacement {
  const asked = input.placement;
  if (fitsSide(input, asked, sidePosition(input, asked))) return asked;
  const opposite = oppositeOf(asked);
  if (fitsSide(input, opposite, sidePosition(input, opposite))) return opposite;
  if (!isVertical(asked)) return asked;
  return roomOnSide(input, opposite) > roomOnSide(input, asked) ? opposite : asked;
}

function isVertical(placement: OverlayPlacement): boolean {
  return placement === "top" || placement === "bottom";
}

/** Moves `start` so a box of `length` cells lies in [min, min + room); at `min` when it is longer. */
function shiftInto(start: number, length: number, min: number, room: number): number {
  const max = min + room - length;
  return Math.max(min, Math.min(start, max));
}

/**
 * The top-left cell of a box of `size` at `position`, shifted (never shrunk)
 * so the box lies inside `bounds`; at the bounds' origin on an axis where it
 * is larger than them. A dragged overlay is kept on the screen with it.
 */
export function clampIntoBounds(
  position: OverlayPosition,
  size: OverlaySize,
  bounds: CellRect,
): OverlayPosition {
  return {
    x: shiftInto(position.x, size.width, bounds.x, bounds.width),
    y: shiftInto(position.y, size.height, bounds.y, bounds.height),
  };
}

/**
 * The top-left cell of an overlay: on the asked side of its anchor, flipped to
 * the opposite side when it does not fit there and the opposite side does,
 * then shifted (never shrunk) so it lies inside the bounds. A top or bottom
 * overlay that fits neither side is never shifted over its anchor: it stays on
 * the side with more room and the rows past the bounds are cut, as Ink draws
 * no rows outside its root. A left or right one that fits neither side is
 * shifted inside the bounds anyway, since a row longer than the terminal would
 * wrap, so in a narrow terminal it may cover its trigger. A cover overlay
 * spans the bounds: it sits at their top-left, never shifted.
 */
export function placeOverlay(input: PlaceOverlayInput): OverlayPosition {
  if (input.placement === "cover") return sidePosition(input, "cover");
  const side = chooseSide(input);
  const position = sidePosition(input, side);
  const bounds = input.bounds;
  const x = shiftInto(position.x, input.size.width, bounds.x, bounds.width);
  const fits = fitsSide(input, side, position);
  if (isVertical(side) && !fits) return { x, y: position.y };
  return { x, y: shiftInto(position.y, input.size.height, bounds.y, bounds.height) };
}

/** True when the overlay fits whole on the asked side of its anchor or on the opposite one. */
function fitsEitherSide(input: PlaceOverlayInput): boolean {
  const placement = input.placement;
  if (fitsSide(input, placement, sidePosition(input, placement))) return true;
  const opposite = oppositeOf(placement);
  return fitsSide(input, opposite, sidePosition(input, opposite));
}

/**
 * True when the overlay can be shown whole at its placement without covering
 * its anchor: a top or bottom one fits on one side of its anchor or the other,
 * a left or right one is no taller than the bounds and fits beside its anchor
 * on one side or the other, a center or cover one always fits. An owner with
 * a compact form shows that one instead when this is false.
 */
export function overlayFits(input: PlaceOverlayInput): boolean {
  const placement = input.placement;
  if (placement === "center" || placement === "cover") return true;
  if (isVertical(placement)) return fitsEitherSide(input);
  return input.size.height <= input.bounds.height && fitsEitherSide(input);
}

/**
 * How many rows the bounds lack under their last row for the overlay to be
 * drawn whole at its placement, 0 when it already fits: a `center`, `left` or
 * `right` overlay lacks the rows by which it is taller than the bounds; a
 * `top` or `bottom` one that fits on neither side of its anchor lacks the rows
 * it would reach past the bounds under its anchor (with the rows added, it
 * goes there); a `cover` one spans the bounds and lacks none.
 */
export function rowsMissingBelow(input: PlaceOverlayInput): number {
  const placement = input.placement;
  if (placement === "cover") return 0;
  const bottom = input.bounds.y + input.bounds.height;
  if (isVertical(placement)) {
    if (fitsEitherSide(input)) return 0;
    const below = sidePosition(input, "bottom");
    return Math.max(0, below.y + input.size.height - bottom);
  }
  return Math.max(0, input.size.height - input.bounds.height);
}

export interface PlaceCompactInput {
  /** The cells of the element the overlay is attached to. */
  anchor: CellRect;
  /** The compact overlay's size (one row). */
  size: OverlaySize;
  /** The rectangle the overlay must stay in (the ink root). */
  bounds: CellRect;
}

/** Empty cells between the anchor and a compact overlay beside it. */
const COMPACT_GAP = 1;

/**
 * The top-left cell of an overlay's compact (one-row) form: on the anchor's
 * row one cell to its right, else one cell to its left, else under it (over
 * it when there is no row under it), shifted inside the bounds.
 */
export function placeCompact(input: PlaceCompactInput): OverlayPosition {
  const beside: PlaceOverlayInput = {
    anchor: input.anchor,
    size: input.size,
    placement: "right",
    gap: COMPACT_GAP,
    bounds: input.bounds,
  };
  const right = sidePosition(beside, "right");
  if (fitsSide(beside, "right", right)) return right;
  const left = sidePosition(beside, "left");
  if (fitsSide(beside, "left", left)) return left;
  return placeOverlay({ ...beside, placement: "bottom", gap: 0 });
}

export interface CompactWidthLimitInput {
  /** The cells of the element the overlay is attached to. */
  anchor: CellRect;
  /** The rectangle the overlay must stay in. */
  bounds: CellRect;
}

/** The fewest cells beside the anchor worth drawing a compact form in. */
const COMPACT_MIN_WIDTH = 8;

/**
 * The widest a compact form may be, so it fits beside its anchor on the
 * anchor's row whenever that is worth it: the larger of the rooms right and
 * left of the anchor (after the one-cell gap), or the bounds' width when
 * neither holds `COMPACT_MIN_WIDTH` cells (the form then goes under or over
 * the anchor). It depends on the anchor and the bounds only, never on the
 * form's size, so measuring the form at this limit is stable.
 */
export function compactWidthLimit(input: CompactWidthLimitInput): number {
  const beside: PlaceOverlayInput = {
    anchor: input.anchor,
    size: { width: 0, height: 0 },
    placement: "right",
    gap: COMPACT_GAP,
    bounds: input.bounds,
  };
  const room = Math.max(roomOnSide(beside, "right"), roomOnSide(beside, "left"));
  if (room >= COMPACT_MIN_WIDTH) return room;
  return input.bounds.width;
}
