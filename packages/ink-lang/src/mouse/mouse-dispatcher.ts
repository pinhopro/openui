import type { MouseEvent } from "./mouse-sequence";
import type { MouseHandlers, MouseTarget, MouseWheelEvent } from "./mouse-target";

/**
 * Turns hit-tested mouse events into handler calls. Each event goes to the
 * nearest target in the chain (innermost first) that handles it: click from a
 * left press and release on one innermost box, contextmenu from a right
 * release, enter and leave from consecutive moves over the innermost box, and
 * wheel ticks coalesced until `flushWheel`.
 */
export interface MouseDispatcher {
  handle: (event: MouseEvent, chain: MouseTarget[]) => void;
  hasPendingWheel: () => boolean;
  flushWheel: () => void;
  /** Drops a target that unmounted so no stale hover or press state refers to it. */
  forget: (target: MouseTarget) => void;
}

interface PendingWheel {
  target: MouseTarget;
  event: MouseWheelEvent;
}

type EventHandlerName =
  | "onMouseDown"
  | "onMouseUp"
  | "onClick"
  | "onContextMenu"
  | "onMouseMove"
  | "onMouseEnter"
  | "onMouseLeave";

function nearestWith(chain: MouseTarget[], name: keyof MouseHandlers): MouseTarget | null {
  for (const target of chain) {
    if (target.handlers[name] !== undefined) return target;
  }
  return null;
}

function callNearest(chain: MouseTarget[], name: EventHandlerName, event: MouseEvent): void {
  const target = nearestWith(chain, name);
  if (target !== null) target.handlers[name]?.(event);
}

function sameWheel(pending: PendingWheel, target: MouseTarget, event: MouseEvent): boolean {
  if (pending.target !== target) return false;
  if (pending.event.direction !== event.wheelDirection) return false;
  if (pending.event.shift !== event.shift) return false;
  if (pending.event.alt !== event.alt) return false;
  return pending.event.ctrl === event.ctrl;
}

export function createMouseDispatcher(): MouseDispatcher {
  let hovered: MouseTarget | null = null;
  let pressed: MouseTarget | null = null;
  let pendingWheel: PendingWheel[] = [];

  function handleMove(event: MouseEvent, chain: MouseTarget[]): void {
    const innermost = chain.length === 0 ? null : (chain[0] as MouseTarget);
    if (innermost !== hovered) {
      if (hovered !== null) hovered.handlers.onMouseLeave?.(event);
      hovered = innermost;
      if (innermost !== null) innermost.handlers.onMouseEnter?.(event);
    }
    callNearest(chain, "onMouseMove", event);
  }

  function handleDown(event: MouseEvent, chain: MouseTarget[]): void {
    if (event.button === "left") pressed = chain.length === 0 ? null : (chain[0] as MouseTarget);
    callNearest(chain, "onMouseDown", event);
  }

  function handleUp(event: MouseEvent, chain: MouseTarget[]): void {
    callNearest(chain, "onMouseUp", event);
    if (event.button === "left") {
      const innermost = chain.length === 0 ? null : (chain[0] as MouseTarget);
      if (innermost !== null && innermost === pressed) callNearest(chain, "onClick", event);
      pressed = null;
      return;
    }
    if (event.button === "right") callNearest(chain, "onContextMenu", event);
  }

  function handleWheel(event: MouseEvent, chain: MouseTarget[]): void {
    const target = nearestWith(chain, "onWheel");
    if (target === null || event.wheelDirection === undefined) return;
    for (const pending of pendingWheel) {
      if (!sameWheel(pending, target, event)) continue;
      pending.event.ticks += 1;
      return;
    }
    pendingWheel.push({
      target,
      event: {
        direction: event.wheelDirection,
        ticks: 1,
        x: event.x,
        y: event.y,
        shift: event.shift,
        alt: event.alt,
        ctrl: event.ctrl,
      },
    });
  }

  function handle(event: MouseEvent, chain: MouseTarget[]): void {
    if (event.kind === "move") return handleMove(event, chain);
    if (event.kind === "down") return handleDown(event, chain);
    if (event.kind === "up") return handleUp(event, chain);
    return handleWheel(event, chain);
  }

  function hasPendingWheel(): boolean {
    return pendingWheel.length > 0;
  }

  function flushWheel(): void {
    const batch = pendingWheel;
    pendingWheel = [];
    for (const pending of batch) pending.target.handlers.onWheel?.(pending.event);
  }

  function forget(target: MouseTarget): void {
    if (hovered === target) hovered = null;
    if (pressed === target) pressed = null;
    const kept: PendingWheel[] = [];
    for (const pending of pendingWheel) {
      if (pending.target !== target) kept.push(pending);
    }
    pendingWheel = kept;
  }

  return { handle, hasPendingWheel, flushWheel, forget };
}
