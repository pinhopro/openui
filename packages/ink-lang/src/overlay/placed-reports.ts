import type { DOMElement } from "ink";
import { elementRect, type CellRect } from "../focus/element-rect";
import type { FormSpot, PlacedOverlay } from "./overlay-measure";
import { alwaysClamped, type OverlayPlacement } from "./overlay-placement";
import type { Overlay, PlacedFrame } from "./overlay-registry";

type PlacedListener = (rect: CellRect | null, frame: PlacedFrame | null) => void;

/** What was last told to one overlay's `onPlaced`, and how to tell it once it closes. */
export interface PlacedReport {
  rect: CellRect | null;
  frame: PlacedFrame | null;
  onPlaced: PlacedListener | null;
}

/** The last report per overlay id, kept while the overlay is open. */
export type PlacedReports = Map<string, PlacedReport>;

/** What an overlay was told before its first report, or with no listener. */
const NOTHING_TOLD: PlacedReport = Object.freeze({ rect: null, frame: null, onPlaced: null });

/** The form a placement shows: the compact one while it shows, else the whole one; null when none shows. */
function shownForm(placed: PlacedOverlay | null): FormSpot | null {
  if (placed === null) return null;
  if (placed.compact !== null && placed.compact.visible) return placed.compact;
  if (placed.whole.visible) return placed.whole;
  return null;
}

/**
 * The cells the shown form of `placed` takes, in the ink root's cells (its
 * spot is relative to the host box `host`); null when nothing shows.
 */
export function shownRect(placed: PlacedOverlay | null, host: DOMElement): CellRect | null {
  const form = shownForm(placed);
  if (form === null) return null;
  const origin = elementRect(host);
  return { x: origin.x + form.x, y: origin.y + form.y, width: form.width, height: form.height };
}

/**
 * How the shown form of `placed` was placed in `bounds`, at the overlay's
 * `placement`; null when nothing (or a cover form) shows.
 */
function shownFrame(
  placed: PlacedOverlay | null,
  bounds: CellRect,
  placement: OverlayPlacement,
): PlacedFrame | null {
  const form = shownForm(placed);
  if (form === null || form.origin === null) return null;
  return {
    origin: { x: form.origin.x, y: form.origin.y },
    bounds,
    alwaysClamped: alwaysClamped(placement),
  };
}

function sameRect(a: CellRect | null, b: CellRect | null): boolean {
  if (a === null || b === null) return a === b;
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

function sameFrame(a: PlacedFrame | null, b: PlacedFrame | null): boolean {
  if (a === null || b === null) return a === b;
  if (a.alwaysClamped !== b.alwaysClamped) return false;
  return a.origin.x === b.origin.x && a.origin.y === b.origin.y && sameRect(a.bounds, b.bounds);
}

export interface ReportPlacedInput {
  /** The last reports, updated in place. */
  reported: PlacedReports;
  /** The open overlays. */
  overlays: readonly Overlay[];
  /** Each open overlay's placement by id, as it is drawn next. */
  placements: ReadonlyMap<string, PlacedOverlay | null>;
  host: DOMElement;
  /** The bounds the overlays were placed in, in the ink root's cells. */
  bounds: CellRect;
}

/**
 * Tells each open overlay's `onPlaced` the cells its shown form takes
 * (`shownRect`) and how it was placed (`PlacedFrame`) when either differs
 * from the last report it was told (nothing shown counts as null, so an
 * overlay starts at null; one without a listener is told nothing), and tells
 * a closed overlay null when it was last told some cells; closed overlays
 * are then forgotten. Called outside render, after the host measured its
 * placements.
 */
export function reportPlaced(input: ReportPlacedInput): void {
  const reported = input.reported;
  const calls: (() => void)[] = [];
  const open = new Set<string>();
  for (const overlay of input.overlays) {
    open.add(overlay.id);
    const placed = input.placements.get(overlay.id) ?? null;
    const rect = shownRect(placed, input.host);
    const frame = shownFrame(placed, input.bounds, overlay.placement);
    const previous = reported.get(overlay.id) ?? NOTHING_TOLD;
    const onPlaced = overlay.onPlaced;
    // An overlay nobody listens to was told nothing: a listener added later hears its cells.
    if (onPlaced === null) {
      reported.set(overlay.id, NOTHING_TOLD);
      continue;
    }
    reported.set(overlay.id, { rect, frame, onPlaced });
    if (sameRect(previous.rect, rect) && sameFrame(previous.frame, frame)) continue;
    calls.push(function tellPlaced() {
      onPlaced(rect, frame);
    });
  }
  for (const [id, report] of Array.from(reported)) {
    if (open.has(id)) continue;
    reported.delete(id);
    const onPlaced = report.onPlaced;
    if (onPlaced === null || report.rect === null) continue;
    calls.push(function tellClosed() {
      onPlaced(null, null);
    });
  }
  // Every report is recorded before any owner hears of it.
  for (const call of calls) call();
}
