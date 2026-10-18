import type { MouseEvent } from "./mouse-sequence";
import type { MouseHandlers, MouseTarget, MouseWheelEvent } from "./mouse-target";

/**
 * Turns hit-tested mouse events into handler calls. Each event goes to the
 * nearest target in the chain (innermost first) that handles it: click from a
 * left press and release on one innermost box, dblclick from two such clicks
 * in quick succession, contextmenu from a right release, enter and leave from
 * consecutive moves over the innermost box, and wheel ticks coalesced until
 * `flushWheel`. While the left button is held the pressed target captures the
 * moves and the release, like a browser drag.
 */
export interface MouseDispatcher {
  handle: (event: MouseEvent, chain: MouseTarget[]) => void;
  hasPendingWheel: () => boolean;
  flushWheel: () => void;
  /** Drops a target that unmounted so no stale hover or press state refers to it. */
  forget: (target: MouseTarget) => void;
}

export interface MouseDispatcherOptions {
  /** The clock for double clicks; defaults to `Date.now`. */
  now?: () => number;
}

/** Two clicks on one target this close together make a double click. */
export const DOUBLE_CLICK_MS = 400;

interface PendingWheel {
  target: MouseTarget;
  event: MouseWheelEvent;
}

interface LastClick {
  target: MouseTarget;
  time: number;
}

type EventHandlerName =
  | "onMouseDown"
  | "onMouseUp"
  | "onClick"
  | "onDoubleClick"
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

function innermostOf(chain: MouseTarget[]): MouseTarget | null {
  return chain.length === 0 ? null : (chain[0] as MouseTarget);
}

function sameWheel(pending: PendingWheel, target: MouseTarget, event: MouseEvent): boolean {
  if (pending.target !== target) return false;
  if (pending.event.direction !== event.wheelDirection) return false;
  if (pending.event.shift !== event.shift) return false;
  if (pending.event.alt !== event.alt) return false;
  return pending.event.ctrl === event.ctrl;
}

function defaultNow(): number {
  return Date.now();
}

export function createMouseDispatcher(options: MouseDispatcherOptions = {}): MouseDispatcher {
  const now = options.now ?? defaultNow;
  let hovered: MouseTarget | null = null;
  /** The innermost target under a left press, which captures moves and the release. */
  let pressed: MouseTarget | null = null;
  /** The chain at that press, so captured events still bubble the same way. */
  let pressedChain: MouseTarget[] = [];
  let lastClick: LastClick | null = null;
  let pendingWheel: PendingWheel[] = [];

  function handleMove(event: MouseEvent, chain: MouseTarget[]): void {
    const innermost = innermostOf(chain);
    if (innermost !== hovered) {
      if (hovered !== null) hovered.handlers.onMouseLeave?.(event);
      hovered = innermost;
      if (innermost !== null) innermost.handlers.onMouseEnter?.(event);
    }
    callNearest(pressed === null ? chain : pressedChain, "onMouseMove", event);
  }

  function handleDown(event: MouseEvent, chain: MouseTarget[]): void {
    if (event.button === "left") {
      pressed = innermostOf(chain);
      pressedChain = chain;
    }
    callNearest(chain, "onMouseDown", event);
  }

  function handleClick(event: MouseEvent, chain: MouseTarget[], target: MouseTarget): void {
    callNearest(chain, "onClick", event);
    const time = now();
    const isDouble =
      lastClick !== null && lastClick.target === target && time - lastClick.time <= DOUBLE_CLICK_MS;
    if (isDouble) {
      callNearest(chain, "onDoubleClick", event);
      lastClick = null;
      return;
    }
    lastClick = { target, time };
  }

  function handleUp(event: MouseEvent, chain: MouseTarget[]): void {
    if (event.button === "left") {
      const captured = pressed;
      const capturedChain = pressedChain;
      pressed = null;
      pressedChain = [];
      if (captured !== null) {
        callNearest(capturedChain, "onMouseUp", event);
        if (innermostOf(chain) === captured) handleClick(event, chain, captured);
        return;
      }
      callNearest(chain, "onMouseUp", event);
      return;
    }
    callNearest(chain, "onMouseUp", event);
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
    if (pressed === target) {
      pressed = null;
      pressedChain = [];
    }
    if (lastClick !== null && lastClick.target === target) lastClick = null;
    const kept: PendingWheel[] = [];
    for (const pending of pendingWheel) {
      if (pending.target !== target) kept.push(pending);
    }
    pendingWheel = kept;
  }

  return { handle, hasPendingWheel, flushWheel, forget };
}
