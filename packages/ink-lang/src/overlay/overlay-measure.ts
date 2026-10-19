import { measureElement, type DOMElement } from "ink";
import { elementRect, type CellRect } from "../focus/element-rect";
import { anchorBackground } from "./anchor-background";
import { clippedBy, rectsIntersect } from "./clip-rect";
import {
  compactWidthLimit,
  overlayFits,
  placeCompact,
  placeOverlay,
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
}

const NO_SIZE: OverlaySize = Object.freeze({ width: 0, height: 0 });

/**
 * The anchor's cells, or null while it is unmounted, takes no cells or is
 * clipped out of sight (scrolled out of a pane that hides its overflow).
 */
function anchorRect(overlay: Overlay): CellRect | null {
  const anchor = overlay.anchorRef.current;
  if (anchor === null) return null;
  const rect = elementRect(anchor);
  if (rect.width === 0 || rect.height === 0) return null;
  const clip = clippedBy(anchor);
  if (clip !== null && !rectsIntersect(rect, clip)) return null;
  return rect;
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
  };
}

/** A form shown at `placed` (cells of the root), moved by the overlay's offset. */
function shownSpot(overlay: Overlay, placed: OverlayPosition, input: SpotInput): FormSpot {
  const origin = hostOrigin(input.host);
  return {
    x: placed.x - origin.x + overlay.offset.x,
    y: placed.y - origin.y + overlay.offset.y,
    maxWidth: input.maxWidth,
    width: input.size.width,
    height: input.size.height,
    visible: true,
    cover: false,
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
  };
}

/**
 * How an overlay is drawn before it was ever measured: its whole form hidden
 * below the root, so the first frame never shows it in a wrong place (over
 * its anchor), except a cover form, which shows at once; null when its anchor
 * is missing, empty or clipped out.
 */
export function unmeasuredPlacement(
  overlay: Overlay,
  host: DOMElement,
  bounds: CellRect,
): PlacedOverlay | null {
  const anchor = anchorRect(overlay);
  if (anchor === null) return null;
  if (overlay.placement === "cover") {
    return {
      whole: coverSpot(host, bounds, anchor),
      compact: null,
      background: backgroundOf(overlay),
    };
  }
  const maxWidth = wholeWidthLimit(bounds);
  return {
    whole: hiddenSpot({ host, bounds, maxWidth, size: NO_SIZE }),
    compact: null,
    background: backgroundOf(overlay),
  };
}

/** The background of the cells the overlay's anchor sits on; null without an anchor or one. */
function backgroundOf(overlay: Overlay): string | null {
  const anchor = overlay.anchorRef.current;
  if (anchor === null) return null;
  return anchorBackground(anchor);
}

/** The forms of an overlay as drawn, without its background. */
interface PlacedForms {
  whole: FormSpot;
  compact: FormSpot | null;
}

/** Where each form of an overlay with a visible anchor is drawn after the last layout. */
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
 * anchor is missing, empty or clipped out (nothing is drawn). It depends only
 * on that layout, never on the form drawn before, so it cannot oscillate:
 * the whole form is measured on every commit (shown or hidden, at the same
 * width limit, the bounds' width), and it is shown while it fits
 * (`overlayFits`) or the overlay has no compact form; otherwise it stays
 * hidden and the compact form, limited to the room beside the anchor
 * (`compactWidthLimit`), is shown beside it (`placeCompact`). A form not
 * measured yet at its current width limit is drawn hidden first. A cover
 * form is never measured: it spans the bounds and shows at once. The
 * overlay takes the background its anchor sits on (`anchorBackground`).
 */
export function measurePlacement(input: MeasureInput): PlacedOverlay | null {
  const anchor = anchorRect(input.overlay);
  if (anchor === null) return null;
  const forms = placeForms(input, anchor);
  return { whole: forms.whole, compact: forms.compact, background: backgroundOf(input.overlay) };
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
