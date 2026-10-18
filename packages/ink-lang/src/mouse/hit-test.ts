import { measureElement, type DOMElement } from "ink";
import type { MouseTarget } from "./mouse-target";

export interface CellRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A target with the layout rect and tree depth it had when the event arrived. */
export interface MeasuredTarget {
  target: MouseTarget;
  rect: CellRect;
  depth: number;
}

interface Candidate {
  measured: MeasuredTarget;
  order: number;
}

function elementDepth(element: DOMElement): number {
  let depth = 0;
  let current: DOMElement | undefined = element.parentNode;
  while (current !== undefined) {
    depth += 1;
    current = current.parentNode;
  }
  return depth;
}

interface Offset {
  x: number;
  y: number;
}

function contentOffset(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.trunc(value);
}

/**
 * How far the ancestors' `contentOffsetX` / `contentOffsetY` (scrolled
 * containers) move the element on screen: Ink's layout metrics leave those
 * out, the terminal cells do not.
 */
function scrolledOffset(element: DOMElement): Offset {
  const offset: Offset = { x: 0, y: 0 };
  let current: DOMElement | undefined = element.parentNode;
  while (current !== undefined) {
    offset.x += contentOffset(current.style.contentOffsetX);
    offset.y += contentOffset(current.style.contentOffsetY);
    current = current.parentNode;
  }
  return offset;
}

/** Measures every mounted target in viewport cells; targets whose ref is empty are skipped. */
export function measureTargets(targets: Iterable<MouseTarget>): MeasuredTarget[] {
  const measured: MeasuredTarget[] = [];
  for (const target of targets) {
    const element = target.ref.current;
    if (element === null) continue;
    const metrics = measureElement(element);
    const scrolled = scrolledOffset(element);
    measured.push({
      target,
      rect: {
        x: metrics.x - scrolled.x,
        y: metrics.y - scrolled.y,
        width: metrics.width,
        height: metrics.height,
      },
      depth: elementDepth(element),
    });
  }
  return measured;
}

function contains(rect: CellRect, x: number, y: number): boolean {
  if (rect.width <= 0 || rect.height <= 0) return false;
  if (x < rect.x || x >= rect.x + rect.width) return false;
  if (y < rect.y || y >= rect.y + rect.height) return false;
  return true;
}

function area(rect: CellRect): number {
  return rect.width * rect.height;
}

/** Innermost first: deeper, then smaller, then registered later. */
function compareInnermost(a: Candidate, b: Candidate): number {
  if (a.measured.depth !== b.measured.depth) return b.measured.depth - a.measured.depth;
  const areaDelta = area(a.measured.rect) - area(b.measured.rect);
  if (areaDelta !== 0) return areaDelta;
  return b.order - a.order;
}

/**
 * The targets whose box contains the cell, innermost first, so the dispatcher
 * can hand an event to the nearest one that handles it. Empty when no box
 * contains the cell.
 */
export function targetsUnderCell(measured: MeasuredTarget[], x: number, y: number): MouseTarget[] {
  const candidates: Candidate[] = [];
  for (let order = 0; order < measured.length; order += 1) {
    const entry = measured[order] as MeasuredTarget;
    if (contains(entry.rect, x, y)) candidates.push({ measured: entry, order });
  }
  candidates.sort(compareInnermost);
  const chain: MouseTarget[] = [];
  for (const candidate of candidates) chain.push(candidate.measured.target);
  return chain;
}
