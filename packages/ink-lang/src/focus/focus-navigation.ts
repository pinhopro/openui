import type { Key } from "ink";
import type { CellRect } from "./element-rect";

export type ArrowDirection = "up" | "down" | "left" | "right";

/** A focus stop the arrow keys can move to. */
export interface NavigationCandidate {
  id: string;
  rect: CellRect;
}

/** The arrow axes a component handles itself; the arrows of the other axis move focus. */
export interface ArrowClaims {
  horizontal?: boolean;
  vertical?: boolean;
}

interface Scored {
  id: string;
  along: number;
  across: number;
}

/** The direction of an arrow key press, or null for any other key or a kitty release. */
export function arrowDirection(key: Key): ArrowDirection | null {
  if (key.eventType === "release") return null;
  if (key.upArrow) return "up";
  if (key.downArrow) return "down";
  if (key.leftArrow) return "left";
  if (key.rightArrow) return "right";
  return null;
}

/** True when the focused component handles arrows of that direction itself. */
export function claimsDirection(claims: ArrowClaims, direction: ArrowDirection): boolean {
  if (direction === "left" || direction === "right") return claims.horizontal === true;
  return claims.vertical === true;
}

function hasSize(rect: CellRect): boolean {
  return rect.width > 0 && rect.height > 0;
}

/** The gap between two spans, 0 when they overlap. */
function spanDistance(aStart: number, aEnd: number, bStart: number, bEnd: number): number {
  if (bStart >= aEnd) return bStart - aEnd;
  if (aStart >= bEnd) return aStart - bEnd;
  return 0;
}

/** The distance along the direction when `candidate` lies there, else -1. */
function distanceAlong(current: CellRect, candidate: CellRect, direction: ArrowDirection): number {
  if (direction === "down") {
    return candidate.y >= current.y + current.height
      ? candidate.y - (current.y + current.height)
      : -1;
  }
  if (direction === "up") {
    return candidate.y + candidate.height <= current.y
      ? current.y - (candidate.y + candidate.height)
      : -1;
  }
  if (direction === "right") {
    return candidate.x >= current.x + current.width
      ? candidate.x - (current.x + current.width)
      : -1;
  }
  return candidate.x + candidate.width <= current.x
    ? current.x - (candidate.x + candidate.width)
    : -1;
}

function distanceAcross(current: CellRect, candidate: CellRect, direction: ArrowDirection): number {
  if (direction === "up" || direction === "down") {
    return spanDistance(
      current.x,
      current.x + current.width,
      candidate.x,
      candidate.x + candidate.width,
    );
  }
  return spanDistance(
    current.y,
    current.y + current.height,
    candidate.y,
    candidate.y + candidate.height,
  );
}

function compareReadingOrder(a: NavigationCandidate, b: NavigationCandidate): number {
  if (a.rect.y !== b.rect.y) return a.rect.y - b.rect.y;
  return a.rect.x - b.rect.x;
}

function compareScore(a: Scored, b: Scored): number {
  if (a.along !== b.along) return a.along - b.along;
  return a.across - b.across;
}

/**
 * The candidate focus moves to for an arrow key: the nearest one in that
 * direction. Left and Right only consider candidates on the current row;
 * Up and Down prefer the current column and otherwise take the nearest.
 * Without a current rect, Down and Right start at the first candidate in
 * reading order and Up and Left at the last. Null when nothing lies there.
 */
export function nextInDirection(
  current: CellRect | null,
  candidates: NavigationCandidate[],
  direction: ArrowDirection,
): string | null {
  const sized: NavigationCandidate[] = [];
  for (const candidate of candidates) {
    if (hasSize(candidate.rect)) sized.push(candidate);
  }
  if (sized.length === 0) return null;
  if (current === null) {
    sized.sort(compareReadingOrder);
    const edge = direction === "down" || direction === "right" ? 0 : sized.length - 1;
    return (sized[edge] as NavigationCandidate).id;
  }
  const isHorizontal = direction === "left" || direction === "right";
  const scored: Scored[] = [];
  for (const candidate of sized) {
    const along = distanceAlong(current, candidate.rect, direction);
    if (along < 0) continue;
    const across = distanceAcross(current, candidate.rect, direction);
    // Left and Right stay on the current row; Up and Down may change column.
    if (isHorizontal && across > 0) continue;
    scored.push({ id: candidate.id, along, across });
  }
  if (scored.length === 0) return null;
  scored.sort(compareScore);
  return (scored[0] as Scored).id;
}
