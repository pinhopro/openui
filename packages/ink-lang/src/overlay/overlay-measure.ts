import { measureElement, type DOMElement } from "ink";
import { elementRect, type CellRect } from "../focus/element-rect";
import { anchorBackground } from "./anchor-background";
import { clippedBy, rectsIntersect } from "./clip-rect";
import { declarationLine, marksDeclaration } from "./declaration-line";
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
} from "./overlay-placement";
import type { Overlay } from "./overlay-registry";
import { rootRect } from "./root-rect";

/**
 * Where one form of an overlay (its whole content or its compact form) is
 * drawn, relative to the host box.
 */
export interface FormSpot {
  x: number;
  y: number;
  /**
   * The widest the form may be, so its content wraps (or is truncated) inside
   * the bounds instead of running past the terminal's edge.
   */
  maxWidth: number;
  /**
   * The form's size as measured, 0 by 0 before that (a cover form's is the
   * bounds' size); an opaque overlay's fill covers it.
   */
  width: number;
  height: number;
  /**
   * False while the form is drawn only to be measured: below the ink root's
   * last row, which Ink does not output, so it never shows.
   */
  visible: boolean;
  /**
   * True for a cover overlay's form: its box is given `width` and `height`
   * (the bounds' size), as it is never measured.
   */
  cover: boolean;
  /**
   * A shown form's top-left as placed, before the overlay's offset moved it,
   * in the ink root's cells; null for a hidden or cover form.
   */
  origin: OverlayPosition | null;
}

/** How one open overlay is drawn. */
export interface PlacedOverlay {
  /** The whole content: shown when it fits (or has no compact form), else only measured. */
  whole: FormSpot;
  /** The compact form, drawn only while the whole one does not fit; null when it is not drawn. */
  compact: FormSpot | null;
  /**
   * The background of the cells under the anchor, painted under an opaque
   * overlay's content (which may set its own); null when none is set.
   */
  background: string | null;
}

export interface MeasureInput {
  overlay: Overlay;
  host: DOMElement;
  /** The whole form's box as drawn on the last commit; null when it was not drawn. */
  wholeBox: DOMElement | null;
  /** The compact form's box as drawn on the last commit; null when it was not drawn. */
  compactBox: DOMElement | null;
  /** The rectangle overlays are placed in. */
  bounds: CellRect;
  /** The box the bounds come from, null for the whole ink root; see `backgroundOf`. */
  boundsBox: DOMElement | null;
}

const NO_SIZE: OverlaySize = Object.freeze({ width: 0, height: 0 });

/** The cells a line or a rectangle covers: a line counts as one cell thick. */
function coveredCells(rect: CellRect): CellRect {
  return { ...rect, width: Math.max(1, rect.width), height: Math.max(1, rect.height) };
}

/**
 * The anchor's cells, or null while it is unmounted, takes no cells or is
 * clipped out of sight (scrolled out of a pane that hides its overflow). An
 * anchor that only marks a declaration (an absolute box taking no cells, see
 * `marksDeclaration`) stands for the line where it was declared
 * (`declarationLine`), seen when that line's row or column is.
 */
function anchorRect(overlay: Overlay): CellRect | null {
  return anchorCells(overlay.anchorRef.current);
}

/** The cells an anchor box stands for, or null; see `anchorRect`. */
function anchorCells(anchor: DOMElement | null): CellRect | null {
  if (anchor === null) return null;
  const isLine = marksDeclaration(anchor);
  const rect = isLine ? declarationLine(anchor) : elementRect(anchor);
  if (rect === null) return null;
  if (!isLine && (rect.width === 0 || rect.height === 0)) return null;
  const clip = clippedBy(anchor);
  if (clip !== null && !rectsIntersect(coveredCells(rect), clip)) return null;
  return rect;
}

/** True for the placements that ignore the anchor's cells: they go against the bounds. */
function inBounds(placement: OverlayPlacement): boolean {
  return placement === "cover" || placement === "center";
}

/** True for an overlay placed in the bounds, whatever its anchor (`inBounds`). */
function placedInBounds(overlay: Overlay): boolean {
  return inBounds(overlay.placement);
}

/**
 * The rectangle an overlay is placed against, or null when nothing is drawn:
 * a `cover` or `center` overlay is placed in the bounds whatever its anchor
 * (null, empty or clipped out: a modal shows even when it was declared in a
 * scrolled-out pane), so the bounds stand in for its anchor; any other
 * overlay needs its anchor's cells (`anchorRect`).
 */
function placementAnchor(overlay: Overlay, bounds: CellRect): CellRect | null {
  if (placedInBounds(overlay)) return bounds;
  return anchorRect(overlay);
}

/** The host box's own cells; positions are relative to them. */
function hostOrigin(host: DOMElement): OverlayPosition {
  const rect = elementRect(host);
  return { x: rect.x, y: rect.y };
}

/** The widest the whole form may be: the bounds' width, at least one cell. */
function wholeWidthLimit(bounds: CellRect): number {
  return Math.max(1, bounds.width);
}

/**
 * A form's size as drawn on the last commit, or null when it was not drawn or
 * was drawn under another width limit (it would wrap differently now).
 */
function measuredSize(box: DOMElement | null, maxWidth: number): OverlaySize | null {
  if (box === null || box.style.maxWidth !== maxWidth) return null;
  const measured = measureElement(box);
  return { width: measured.width, height: measured.height };
}

interface SpotInput {
  host: DOMElement;
  bounds: CellRect;
  maxWidth: number;
  size: OverlaySize;
}

/** A form drawn only to be measured: at the bounds' left edge, on the first row below the root. */
function hiddenSpot(input: SpotInput): FormSpot {
  const origin = hostOrigin(input.host);
  const root = rootRect(input.host);
  return {
    x: input.bounds.x - origin.x,
    y: root.y + root.height - origin.y,
    maxWidth: input.maxWidth,
    width: input.size.width,
    height: input.size.height,
    visible: false,
    cover: false,
    origin: null,
  };
}

/**
 * Where a form placed at `placed` (cells of the root) is shown: moved by the
 * overlay's offset, then clamped into the bounds (`clampIntoBounds`), so a
 * dragged form never leaves them. Without an offset it stays where it was
 * placed, which may leave rows past the bounds on purpose (`placeOverlay`).
 */
function movedPosition(
  overlay: Overlay,
  placed: OverlayPosition,
  input: SpotInput,
): OverlayPosition {
  const offset = overlay.offset;
  if (offset.x === 0 && offset.y === 0) return placed;
  const moved = { x: placed.x + offset.x, y: placed.y + offset.y };
  return clampIntoBounds(moved, input.size, input.bounds);
}

/** A form shown at `placed` (cells of the root), moved by the overlay's offset (`movedPosition`). */
function shownSpot(overlay: Overlay, placed: OverlayPosition, input: SpotInput): FormSpot {
  const origin = hostOrigin(input.host);
  const position = movedPosition(overlay, placed, input);
  return {
    x: position.x - origin.x,
    y: position.y - origin.y,
    maxWidth: input.maxWidth,
    width: input.size.width,
    height: input.size.height,
    visible: true,
    cover: false,
    origin: placed,
  };
}

/**
 * A cover overlay's form: as large as the bounds and shown at once at their
 * top-left (`placeOverlay`), with no offset; never measured, since its size
 * is the bounds' size, so it needs no hidden first pass.
 */
function coverSpot(host: DOMElement, bounds: CellRect, anchor: CellRect): FormSpot {
  const origin = hostOrigin(host);
  const size: OverlaySize = { width: bounds.width, height: bounds.height };
  const placed = placeOverlay({ anchor, size, placement: "cover", gap: 0, bounds });
  return {
    x: placed.x - origin.x,
    y: placed.y - origin.y,
    maxWidth: bounds.width,
    width: size.width,
    height: size.height,
    visible: true,
    cover: true,
    origin: null,
  };
}

/**
 * How an overlay is drawn before it was ever measured: its whole form hidden
 * below the root, so the first frame never shows it in a wrong place (over
 * its anchor), except a cover form, which shows at once; null when its anchor
 * is missing, empty or clipped out (never for a `cover` or `center` overlay,
 * see `placementAnchor`).
 */
export function unmeasuredPlacement(
  overlay: Overlay,
  host: DOMElement,
  bounds: CellRect,
  boundsBox: DOMElement | null,
): PlacedOverlay | null {
  const anchor = placementAnchor(overlay, bounds);
  if (anchor === null) return null;
  const background = backgroundOf(overlay, host, boundsBox);
  if (overlay.placement === "cover") {
    return { whole: coverSpot(host, bounds, anchor), compact: null, background };
  }
  const maxWidth = wholeWidthLimit(bounds);
  return {
    whole: hiddenSpot({ host, bounds, maxWidth, size: NO_SIZE }),
    compact: null,
    background,
  };
}

/**
 * The background an overlay is painted with: for a `cover` or `center` one,
 * the background of the bounds box (the host's own when the bounds are the
 * whole root), as it is placed in them; for any other, the background of the
 * cells its anchor sits on. Null when none is set or the anchor is missing.
 */
function backgroundOf(
  overlay: Overlay,
  host: DOMElement,
  boundsBox: DOMElement | null,
): string | null {
  if (placedInBounds(overlay)) return anchorBackground(boundsBox ?? host);
  const anchor = overlay.anchorRef.current;
  if (anchor === null) return null;
  return anchorBackground(anchor);
}

/** The forms of an overlay as drawn, without its background. */
interface PlacedForms {
  whole: FormSpot;
  compact: FormSpot | null;
}

/**
 * Where each form of an overlay is drawn after the last layout, against
 * `anchor` (its visible anchor's cells, or the bounds for a `cover` or
 * `center` overlay).
 */
function placeForms(input: MeasureInput, anchor: CellRect): PlacedForms {
  const overlay = input.overlay;
  const host = input.host;
  const bounds = input.bounds;
  if (overlay.placement === "cover") {
    return { whole: coverSpot(host, bounds, anchor), compact: null };
  }
  const wholeLimit = wholeWidthLimit(bounds);
  const wholeSize = measuredSize(input.wholeBox, wholeLimit);
  if (wholeSize === null) {
    return {
      whole: hiddenSpot({ host, bounds, maxWidth: wholeLimit, size: NO_SIZE }),
      compact: null,
    };
  }
  const whole = {
    anchor,
    size: wholeSize,
    placement: overlay.placement,
    gap: overlay.gap,
    bounds,
  };
  const wholeSpot: SpotInput = { host, bounds, maxWidth: wholeLimit, size: wholeSize };
  if (overlay.renderCompact === null || overlayFits(whole)) {
    return { whole: shownSpot(overlay, placeOverlay(whole), wholeSpot), compact: null };
  }
  const compactLimit = compactWidthLimit({ anchor, bounds });
  const compactSize = measuredSize(input.compactBox, compactLimit);
  if (compactSize === null) {
    return {
      whole: hiddenSpot(wholeSpot),
      compact: hiddenSpot({ host, bounds, maxWidth: compactLimit, size: NO_SIZE }),
    };
  }
  const placed = placeCompact({ anchor, size: compactSize, bounds });
  return {
    whole: hiddenSpot(wholeSpot),
    compact: shownSpot(overlay, placed, {
      host,
      bounds,
      maxWidth: compactLimit,
      size: compactSize,
    }),
  };
}

/**
 * How an overlay is drawn after the last commit's layout, or null when its
 * anchor is missing, empty or clipped out (nothing is drawn; a `cover` or
 * `center` overlay is always drawn, in the bounds). It depends only
 * on that layout, never on the form drawn before, so it cannot oscillate:
 * the whole form is measured on every commit (shown or hidden, at the same
 * width limit, the bounds' width), and it is shown while it fits
 * (`overlayFits`) or the overlay has no compact form; otherwise it stays
 * hidden and the compact form, limited to the room beside the anchor
 * (`compactWidthLimit`), is shown beside it (`placeCompact`). A form not
 * measured yet at its current width limit is drawn hidden first. A cover
 * form is never measured: it spans the bounds and shows at once. The
 * overlay takes the background its anchor sits on, or its bounds' one
 * (`backgroundOf`).
 */
export function measurePlacement(input: MeasureInput): PlacedOverlay | null {
  const anchor = placementAnchor(input.overlay, input.bounds);
  if (anchor === null) return null;
  const forms = placeForms(input, anchor);
  return {
    whole: forms.whole,
    compact: forms.compact,
    background: backgroundOf(input.overlay, input.host, input.boundsBox),
  };
}

export interface PlacedOriginInput {
  /** The box the form is placed against; an absolute box taking no cells marks a declaration. */
  anchor: DOMElement | null;
  placement: OverlayPlacement;
  gap: number;
  /** The whole form's size, as measured. */
  size: OverlaySize;
  /** The rectangle the overlays are placed in. */
  bounds: CellRect;
}

/**
 * Where the host places the whole form of an overlay with no compact form
 * (a dialog) against `anchor` after the last layout, before its offset moves
 * it: the `origin` of the `PlacedFrame` it reports. An owner about to give
 * its overlay another anchor reads it to keep the form where it is drawn.
 * Null when nothing would be drawn (the anchor is missing, empty or clipped
 * out); a `center` or `cover` placement goes in the bounds whatever the anchor.
 */
export function placedOrigin(input: PlacedOriginInput): OverlayPosition | null {
  const anchor = inBounds(input.placement) ? input.bounds : anchorCells(input.anchor);
  if (anchor === null) return null;
  return placeOverlay({
    anchor,
    size: input.size,
    placement: input.placement,
    gap: input.gap,
    bounds: input.bounds,
  });
}

/**
 * How many rows must be added under `content` (the bounds' cells down to the
 * last row of the page's content, without rows added under it) for a dialog
 * or a modal to be drawn whole at its placement, 0 when it fits there
 * (`rowsMissingBelow`) or its whole form was not measured yet at the current
 * width limit. A tooltip lacks none: it has its compact form.
 */
export function rowsPastContent(input: MeasureInput, content: CellRect): number {
  const overlay = input.overlay;
  if (overlay.kind === "tooltip") return 0;
  const anchor = placementAnchor(overlay, content);
  if (anchor === null) return 0;
  const size = measuredSize(input.wholeBox, wholeWidthLimit(input.bounds));
  if (size === null) return 0;
  return rowsMissingBelow({
    anchor,
    size,
    placement: overlay.placement,
    gap: overlay.gap,
    bounds: content,
  });
}

function sameSpot(a: FormSpot | null, b: FormSpot | null): boolean {
  if (a === null || b === null) return a === b;
  if (a.x !== b.x || a.y !== b.y || a.visible !== b.visible || a.cover !== b.cover) return false;
  return a.maxWidth === b.maxWidth && a.width === b.width && a.height === b.height;
}

/** True when both placements draw the same forms in the same cells. */
export function samePlacement(a: PlacedOverlay | null, b: PlacedOverlay | null): boolean {
  if (a === null || b === null) return a === b;
  if (a.background !== b.background) return false;
  return sameSpot(a.whole, b.whole) && sameSpot(a.compact, b.compact);
}
