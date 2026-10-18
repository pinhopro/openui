import type { DOMElement } from "ink";
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
  /** Position in the element tree, outermost child index first: the Tab order sorts by it. */
  path: number[];
  rect: CellRect;
  arrows: ArrowMap;
}

const DIRECTIONS: ArrowDirection[] = ["up", "down", "left", "right"];

function arrowMap(entry: FocusEntry): ArrowMap {
  const map: ArrowMap = { up: false, down: false, left: false, right: false };
  for (const direction of DIRECTIONS) map[direction] = claimsDirection(entry.arrows, direction);
  return map;
}

/** The child indexes from the root down to `element`. */
function documentPath(element: DOMElement): number[] {
  const path: number[] = [];
  let node: DOMElement = element;
  while (node.parentNode !== undefined) {
    const parent = node.parentNode;
    path.push(parent.childNodes.indexOf(node));
    node = parent;
  }
  path.reverse();
  return path;
}

function compareDocumentOrder(a: FocusStop, b: FocusStop): number {
  const length = Math.min(a.path.length, b.path.length);
  for (let depth = 0; depth < length; depth += 1) {
    const difference = (a.path[depth] as number) - (b.path[depth] as number);
    if (difference !== 0) return difference;
  }
  return a.path.length - b.path.length;
}

/**
 * The active, mounted focus stops in document order (the order the program
 * lays them out in, outer to inner, first child first): the deterministic
 * Tab order, built from where every stop sits in the element tree rather
 * than from the order components happened to mount in.
 */
export function focusOrder(registry: FocusRegistry): FocusStop[] {
  const stops: FocusStop[] = [];
  for (const entry of registry.entries()) {
    const element = entry.ref.current;
    if (!entry.isActive || element === null) continue;
    const rect = elementRect(element);
    if (rect.width <= 0 || rect.height <= 0) continue;
    stops.push({
      id: entry.id,
      component: entry.component,
      name: entry.name,
      path: documentPath(element),
      rect,
      arrows: arrowMap(entry),
    });
  }
  stops.sort(compareDocumentOrder);
  return stops;
}

/** The stop after (or before) `activeId` in document order, wrapping around; the first when none is active. */
export function nextInOrder(
  stops: FocusStop[],
  activeId: string | undefined,
  delta: 1 | -1,
): string | null {
  if (stops.length === 0) return null;
  let index = -1;
  for (let position = 0; position < stops.length; position += 1) {
    if ((stops[position] as FocusStop).id === activeId) index = position;
  }
  if (index === -1) return (stops[delta === 1 ? 0 : stops.length - 1] as FocusStop).id;
  const next = (index + delta + stops.length) % stops.length;
  return (stops[next] as FocusStop).id;
}
