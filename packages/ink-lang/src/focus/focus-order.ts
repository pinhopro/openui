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
  /** The stop's sequence path (see `useFocusable`): the Tab order sorts by it. */
  path: number[];
  rect: CellRect;
  arrows: ArrowMap;
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
 * The active, mounted stops of the program in document order: the
 * deterministic Tab order, sorted by sequence path, so it follows the program
 * tree whatever order the components mounted in and wherever they are laid
 * out. Stops outside the renderer have no path and are left out (see
 * `hostStops`).
 */
export function focusOrder(registry: FocusRegistry): FocusStop[] {
  const stops: FocusStop[] = [];
  for (const entry of registry.entries()) {
    const element = entry.ref.current;
    if (!entry.isActive || element === null || entry.path === null) continue;
    const rect = elementRect(element);
    if (rect.width <= 0 || rect.height <= 0) continue;
    stops.push({
      id: entry.id,
      component: entry.component,
      name: entry.name,
      path: entry.path,
      rect,
      arrows: arrowMap(entry),
    });
  }
  stops.sort(compareStops);
  return stops;
}

/** The active stops outside the renderer (the host's own), in registration order. */
export function hostStops(registry: FocusRegistry): FocusEntry[] {
  const stops: FocusEntry[] = [];
  for (const entry of registry.entries()) {
    if (entry.isActive && entry.path === null) stops.push(entry);
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
