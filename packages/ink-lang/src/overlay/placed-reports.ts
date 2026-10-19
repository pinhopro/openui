import type { DOMElement } from "ink";
import { elementRect, type CellRect } from "../focus/element-rect";
import type { FormSpot, PlacedOverlay } from "./overlay-measure";
import type { Overlay } from "./overlay-registry";

/** What was last told to one overlay's `onPlaced`, and how to tell it once it closes. */
export interface PlacedReport {
  rect: CellRect | null;
  onPlaced: ((rect: CellRect | null) => void) | null;
}

/** The last report per overlay id, kept while the overlay is open. */
export type PlacedReports = Map<string, PlacedReport>;

/** The form a placement shows: the compact one while it shows, else the whole one; null when none shows. */
function shownForm(placed: PlacedOverlay): FormSpot | null {
  if (placed.compact !== null && placed.compact.visible) return placed.compact;
  if (placed.whole.visible) return placed.whole;
  return null;
}

/**
 * The cells the shown form of `placed` takes, in the ink root's cells (its
 * spot is relative to the host box `host`); null when nothing shows.
 */
export function shownRect(placed: PlacedOverlay | null, host: DOMElement): CellRect | null {
  if (placed === null) return null;
  const form = shownForm(placed);
  if (form === null) return null;
  const origin = elementRect(host);
  return { x: origin.x + form.x, y: origin.y + form.y, width: form.width, height: form.height };
}

function sameRect(a: CellRect | null, b: CellRect | null): boolean {
  if (a === null || b === null) return a === b;
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

export interface ReportPlacedInput {
  /** The last reports, updated in place. */
  reported: PlacedReports;
  /** The open overlays. */
  overlays: readonly Overlay[];
  /** Each open overlay's placement by id, as it is drawn next. */
  placements: ReadonlyMap<string, PlacedOverlay | null>;
  host: DOMElement;
}

/**
 * Tells each open overlay's `onPlaced` the cells its shown form takes
 * (`shownRect`) when they differ from the last ones it was told (nothing
 * shown counts as null, so an overlay starts at null; one without a listener
 * is told nothing), and tells a closed
 * overlay null when it was last told some cells; closed overlays are then
 * forgotten. Called outside render, after the host measured its placements.
 */
export function reportPlaced(input: ReportPlacedInput): void {
  const reported = input.reported;
  const calls: (() => void)[] = [];
  const open = new Set<string>();
  for (const overlay of input.overlays) {
    open.add(overlay.id);
    const rect = shownRect(input.placements.get(overlay.id) ?? null, input.host);
    const previous = reported.get(overlay.id);
    const previousRect = previous === undefined ? null : previous.rect;
    const onPlaced = overlay.onPlaced;
    // An overlay nobody listens to was told nothing: a listener added later hears its cells.
    reported.set(overlay.id, { rect: onPlaced === null ? null : rect, onPlaced });
    if (onPlaced === null || sameRect(previousRect, rect)) continue;
    calls.push(function tellPlaced() {
      onPlaced(rect);
    });
  }
  for (const [id, report] of Array.from(reported)) {
    if (open.has(id)) continue;
    reported.delete(id);
    const onPlaced = report.onPlaced;
    if (onPlaced === null || report.rect === null) continue;
    calls.push(function tellClosed() {
      onPlaced(null);
    });
  }
  // Every report is recorded before any owner hears of it.
  for (const call of calls) call();
}
