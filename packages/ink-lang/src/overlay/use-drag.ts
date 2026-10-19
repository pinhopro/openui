import { useEffect, useRef, useState } from "react";
import type { CellRect } from "../focus/element-rect";
import type { MouseEvent } from "../mouse/mouse-sequence";
import type { MouseHandlers } from "../mouse/mouse-target";
import { useUiEvents, type UiEventType } from "../ui-events";

/** Cells an overlay is moved from where it is placed: `x` to the right, `y` down. */
export interface DragOffset {
  x: number;
  y: number;
}

export interface UseDragOptions {
  /**
   * False freezes the offset: no mouse handlers, and `moveBy` does nothing.
   * Pass false while the overlay is closed too: a drag it closed in the
   * middle of then ends (`dragend` where the pointer was last).
   */
  enabled: boolean;
  /** What the drag events name (the dialog's title). */
  name: string;
  /** The component the drag events report (`ModalDialog`, `Dialog`, `Modal`). */
  component: string;
  /** Called when a move is dropped: on the release, and after each `moveBy`. */
  onDrop: () => void;
}

export interface DragState {
  /** The offset to pass to the overlay's `useOverlay`. */
  offset: DragOffset;
  /** True from a left press on the handle until its release. */
  isDragging: boolean;
  /** Moves the overlay by whole cells and drops it at once (a keyboard move). */
  moveBy: (dx: number, dy: number) => void;
  /** The handle's mouse handlers, for `DragHandle`; empty while disabled. */
  handlers: MouseHandlers;
  /** The overlay's `onPlaced`: keeps the last cells it was shown at. */
  onPlaced: (rect: CellRect | null) => void;
}

/** Where a press on the handle started a drag. */
interface Press {
  x: number;
  y: number;
  offsetAtPress: DragOffset;
  /** The pointer's cell at the last event of the drag. */
  lastX: number;
  lastY: number;
}

const NO_OFFSET: DragOffset = Object.freeze({ x: 0, y: 0 });
const NO_HANDLERS: MouseHandlers = Object.freeze({});

function sameOffset(a: DragOffset, b: DragOffset): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * Moves an overlay by its handle, like a browser drag: a left press on the
 * handle records the pointer's cell and the offset at that moment, each move
 * while the button is held (the dispatcher's capture delivers them wherever
 * the pointer is) sets the offset to that one plus the pointer's travel, and
 * the release drops it (`onDrop`). The overlay is clamped into its bounds by
 * the host, never here. A move that arrives with no button held means the
 * release was lost (outside the terminal): it drops there. `moveBy` moves it
 * from the keyboard and drops at once. Reports `dragstart`, `drag` (only for
 * a move that changed the offset) and `dragend` through `useUiEvents`, at
 * the pointer's cell, or for a keyboard move at the overlay's top-left cell
 * (from the last cells it was shown at, else the offset). The mouse
 * handlers must be registered by a `DragHandle` inside the overlay's
 * content, so the handle takes events in the overlay's layer.
 */
export function useDrag(options: UseDragOptions): DragState {
  const emit = useUiEvents();
  const [offset, setOffset] = useState<DragOffset>(NO_OFFSET);
  const [isDragging, setDragging] = useState(false);
  // Handlers can run several times between renders (moves in one stdin chunk): they read refs.
  const offsetRef = useRef<DragOffset>(NO_OFFSET);
  const press = useRef<Press | null>(null);
  const placed = useRef<CellRect | null>(null);
  const enabled = options.enabled;

  function report(type: UiEventType, x: number, y: number): void {
    emit({ type, component: options.component, name: options.name, x, y });
  }

  function apply(next: DragOffset): void {
    offsetRef.current = next;
    setOffset(next);
  }

  // Disabled mid-drag (the dialog closed while the button was held): the release
  // will never reach the handle, so the drag ends here, where the pointer was last.
  useEffect(function abandonDragWhenDisabled() {
    const started = press.current;
    if (enabled || started === null) return;
    press.current = null;
    setDragging(false);
    report("dragend", started.lastX, started.lastY);
  });

  function drop(event: MouseEvent): void {
    press.current = null;
    setDragging(false);
    report("dragend", event.x, event.y);
    options.onDrop();
  }

  function handleMouseDown(event: MouseEvent): void {
    if (event.button !== "left") return;
    press.current = {
      x: event.x,
      y: event.y,
      offsetAtPress: offsetRef.current,
      lastX: event.x,
      lastY: event.y,
    };
    setDragging(true);
    report("dragstart", event.x, event.y);
  }

  function handleMouseMove(event: MouseEvent): void {
    const started = press.current;
    if (started === null) return;
    if (event.button !== "left") {
      drop(event);
      return;
    }
    started.lastX = event.x;
    started.lastY = event.y;
    const next = {
      x: started.offsetAtPress.x + event.x - started.x,
      y: started.offsetAtPress.y + event.y - started.y,
    };
    if (sameOffset(next, offsetRef.current)) return;
    apply(next);
    report("drag", event.x, event.y);
  }

  function handleMouseUp(event: MouseEvent): void {
    if (press.current === null || event.button !== "left") return;
    drop(event);
  }

  /** The overlay's top-left cell, or the offset before it was ever shown. */
  function topLeft(): DragOffset {
    const rect = placed.current;
    return rect === null ? offsetRef.current : { x: rect.x, y: rect.y };
  }

  function moveBy(dx: number, dy: number): void {
    if (!enabled) return;
    const from = topLeft();
    report("dragstart", from.x, from.y);
    apply({ x: offsetRef.current.x + dx, y: offsetRef.current.y + dy });
    const to = { x: from.x + dx, y: from.y + dy };
    report("drag", to.x, to.y);
    report("dragend", to.x, to.y);
    options.onDrop();
  }

  function onPlaced(rect: CellRect | null): void {
    // A null comes while the form is re-measured too: keep the last cells it showed at.
    if (rect !== null) placed.current = rect;
  }

  const handlers: MouseHandlers = enabled
    ? { onMouseDown: handleMouseDown, onMouseMove: handleMouseMove, onMouseUp: handleMouseUp }
    : NO_HANDLERS;
  return { offset, isDragging: enabled && isDragging, moveBy, handlers, onPlaced };
}
