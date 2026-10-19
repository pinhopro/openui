import type { CellPoint } from "./element-rect";
import type { FocusStop } from "./focus-order";

/** True when the cell lies inside the stop's rectangle. */
function contains(stop: FocusStop, cell: CellPoint): boolean {
  const rect = stop.rect;
  if (cell.x < rect.x || cell.x >= rect.x + rect.width) return false;
  return cell.y >= rect.y && cell.y < rect.y + rect.height;
}

/**
 * True when the stop's top-left comes before the cell in reading order: a
 * row above, or left on the same row.
 */
function startsBefore(stop: FocusStop, cell: CellPoint): boolean {
  if (stop.rect.y !== cell.y) return stop.rect.y < cell.y;
  return stop.rect.x < cell.x;
}

/** Reading order of two stops by their top-left: by row, then by column. */
function compareReading(a: FocusStop, b: FocusStop): number {
  if (a.rect.y !== b.rect.y) return a.rect.y - b.rect.y;
  return a.rect.x - b.rect.x;
}

/**
 * The id of the stop a dialog dropped with its top-left at `topLeft` sits
 * behind, which it re-anchors to: of the base stops (`overlay === null`), the
 * one whose rectangle contains the cell, else the last one in reading order
 * (by the top-left of each, row then column) that starts before the cell;
 * null when the cell comes before every base stop.
 */
export function anchorBehind(topLeft: CellPoint, stops: FocusStop[]): string | null {
  let before: FocusStop | null = null;
  for (const stop of stops) {
    if (stop.overlay !== null) continue;
    if (contains(stop, topLeft)) return stop.id;
    if (!startsBefore(stop, topLeft)) continue;
    if (before === null || compareReading(stop, before) > 0) before = stop;
  }
  return before === null ? null : before.id;
}
