import { elementRect, type CellRect } from "./element-rect";
import { claimsDirection, type ArrowDirection } from "./focus-navigation";
import type { FocusEntry, FocusRegistry } from "./focus-registry";

/** Which arrows a stop keeps for itself right now. */
export interface ArrowMap {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

/** One focus stop as the host can inspect it: where it is, what it is and which arrows it uses. */
export interface FocusStop {
  id: string;
  component: string;
  name: string;
  /**
   * The rank of the stop's program among the renderers of its `FocusScope`
   * (0 for a standalone renderer): the first number of `path`.
   */
  program: number;
  /** The stop's sequence path (see `useFocusable`), program rank first: the Tab order sorts by it. */
  path: number[];
  rect: CellRect;
  arrows: ArrowMap;
  /** The id of the overlay the stop renders in; null for a stop outside any overlay. */
  overlay: string | null;
}

/** The largest order: a stop that comes after every other child of its element. */
export const ORDER_LAST = Number.MAX_SAFE_INTEGER;

const DIRECTIONS: ArrowDirection[] = ["up", "down", "left", "right"];

function arrowMap(entry: FocusEntry): ArrowMap {
  const map: ArrowMap = { up: false, down: false, left: false, right: false };
  for (const direction of DIRECTIONS) map[direction] = claimsDirection(entry.arrows, direction);
  return map;
}

/**
 * Document order of two sequence paths: element by element, then the shorter
 * one first, so a component's own stop comes before the stops of the child it
 * renders at the same order.
 */
export function compareSequencePath(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  for (let depth = 0; depth < length; depth += 1) {
    const difference = (a[depth] as number) - (b[depth] as number);
    if (difference !== 0) return difference;
  }
  return a.length - b.length;
}

function compareStops(a: FocusStop, b: FocusStop): number {
  return compareSequencePath(a.path, b.path);
}

/**
 * Where a stop the Tab cycle can visit sits on screen; null for a stop that is
 * inactive, not mounted or takes up no room. Program and host stops share it.
 */
function reachableRect(entry: FocusEntry): CellRect | null {
  const element = entry.ref.current;
  if (!entry.isActive || element === null) return null;
  const rect = elementRect(element);
  if (rect.width <= 0 || rect.height <= 0) return null;
  return rect;
}

/**
 * The active, mounted stops of the programs in document order: the
 * deterministic Tab order, sorted by sequence path (program rank first, so
 * every stop of one renderer comes before the next renderer's), so it follows
 * the program tree whatever order the components mounted in and wherever they
 * are laid out. Stops outside the renderers have no path and are left out
 * (see `hostStops`).
 */
export function focusOrder(registry: FocusRegistry): FocusStop[] {
  const stops: FocusStop[] = [];
  for (const entry of registry.entries()) {
    if (entry.path === null) continue;
    const rect = reachableRect(entry);
    if (rect === null) continue;
    stops.push({
      id: entry.id,
      component: entry.component,
      name: entry.name,
      program: entry.path[0] ?? 0,
      path: entry.path,
      rect,
      arrows: arrowMap(entry),
      overlay: entry.overlay,
    });
  }
  stops.sort(compareStops);
  return stops;
}

/**
 * The active, mounted stops outside the renderer (the host's own), in
 * registration order.
 */
export function hostStops(registry: FocusRegistry): FocusEntry[] {
  const stops: FocusEntry[] = [];
  for (const entry of registry.entries()) {
    if (entry.path === null && reachableRect(entry) !== null) stops.push(entry);
  }
  return stops;
}

/** A stop in a Tab cycle: a program stop, a host stop or anything else with its focus id. */
export interface CycleStop {
  id: string;
}

/** The stop after (or before) `activeId` in the cycle, wrapping around; the first when none is active. */
export function nextInOrder(
  stops: CycleStop[],
  activeId: string | undefined,
  delta: 1 | -1,
): string | null {
  if (stops.length === 0) return null;
  let index = -1;
  for (let position = 0; position < stops.length; position += 1) {
    if ((stops[position] as CycleStop).id === activeId) index = position;
  }
  if (index === -1) return (stops[delta === 1 ? 0 : stops.length - 1] as CycleStop).id;
  const next = (index + delta + stops.length) % stops.length;
  return (stops[next] as CycleStop).id;
}
