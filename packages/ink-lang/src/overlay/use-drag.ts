import { useEffect, useRef, useState } from "react";
import type { CellRect } from "../focus/element-rect";
import type { MouseEvent } from "../mouse/mouse-sequence";
import type { MouseHandlers } from "../mouse/mouse-target";
import { useUiEvents, type UiEventType } from "../ui-events";
import { drawnOffset, drawnTopLeft, sameReference, type ShownPlacement } from "./drawn-offset";
import type { PlacedFrame } from "./overlay-registry";

/** Cells an overlay is moved from where it is placed: `x` to the right, `y` down. */
export interface DragOffset {
  x: number;
  y: number;
}

export interface UseDragOptions {
  /**
   * False freezes the offset: no mouse handlers, and `moveBy` does nothing.
   * Pass false while the overlay is closed or the program streams too: a
   * drag that stops being allowed in the middle then ends (`dragend` where
   * the pointer was last).
   */
  enabled: boolean;
  /** What the drag events name (the dialog's title). */
  name: string;
  /** The component the drag events report (`ModalDialog`, `Dialog`, `Modal`). */
  component: string;
  /**
   * Called when a move is dropped: on the release, and after each `moveBy`
   * that moved it, with where the form is drawn now (null while no placement
   * was reported yet).
   */
  onDrop: (dropped: DroppedForm | null) => void;
}

/** Where a dropped form is drawn, in the ink root's cells. */
export interface DroppedForm {
  /** The cells it takes. */
  rect: CellRect;
  /** The bounds it is kept in. */
  bounds: CellRect;
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
  /** The overlay's `onPlaced`: keeps the last placement it was shown with. */
  onPlaced: (rect: CellRect | null, frame: PlacedFrame | null) => void;
  /**
   * The overlay is placed at `origin` from its next render on (its owner
   * gave it another anchor): the offset becomes the one that keeps the form
   * drawn where it is. Does nothing while no placement was reported yet.
   */
  setOrigin: (origin: DragOffset) => void;
  /** Drops the offset: the form shows where it is placed. */
  resetOffset: () => void;
}

/** Where a press on the handle started a drag. */
interface Press {
  x: number;
  y: number;
  offsetAtPress: DragOffset;
  /** The pointer's cell at the last event of the drag. */
  lastX: number;
  lastY: number;
  /** The placement `x`, `y` and `offsetAtPress` are measured against. */
  shown: ShownPlacement | null;
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
 * the pointer is) sets the offset to that one plus the pointer's travel, so
 * the grab point stays under the pointer, and the release drops it
 * (`onDrop`). The host clamps the drawn overlay into its bounds; the offset
 * is brought back to what was drawn (`drawnOffset`, from the last placement
 * `onPlaced` heard of) at every press, drop and keyboard move, so an excess
 * past an edge never lingers. When the host places the form differently
 * while the button is held (a resize re-centres a modal, moves an anchor or
 * shrinks the bounds), the next move goes on from the pointer's last cell
 * and from where the form is drawn now, so it never jumps. A move that arrives with no button held means
 * the release was lost (outside the terminal): it drops there. `moveBy`
 * moves it from the keyboard and drops at once, and does nothing when the
 * bounds leave no room that way. Reports `dragstart`, `drag` (only for a
 * move that changed the offset) and `dragend` through `useUiEvents`, at the
 * pointer's cell, or for a keyboard move at the overlay's top-left cell
 * before and after it. `onDrop` is told where the form is drawn after the
 * drop; an owner that then gives the overlay another anchor calls
 * `setOrigin` with where the host will place it, so it stays put. The mouse
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
  const shown = useRef<ShownPlacement | null>(null);
  const enabled = options.enabled;
  const latest = useRef(options);
  latest.current = options;

  function report(type: UiEventType, x: number, y: number): void {
    const current = latest.current;
    emit({ type, component: current.component, name: current.name, x, y });
  }

  function apply(next: DragOffset): void {
    if (sameOffset(next, offsetRef.current)) return;
    offsetRef.current = next;
    setOffset(next);
  }

  /** Drops any excess the clamp cut off; returns the offset as drawn. */
  function rebase(): DragOffset {
    const exact = drawnOffset(offsetRef.current, shown.current);
    apply(exact);
    return exact;
  }

  // Disabled mid-drag (the dialog closed, the program streams): the release
  // will never reach the handle, so the drag ends here, where the pointer was last.
  useEffect(
    function abandonDragWhenDisabled() {
      const started = press.current;
      if (enabled || started === null) return;
      press.current = null;
      setDragging(false);
      rebase();
      report("dragend", started.lastX, started.lastY);
    },
    // Only a change of `enabled` can end a drag here; the helpers read refs.
    [enabled],
  );

  /** Where the form is drawn with the current offset (which has no excess); null while unknown. */
  function droppedForm(): DroppedForm | null {
    const placed = shown.current;
    if (placed === null || placed.frame === null) return null;
    const topLeft = drawnTopLeft(offsetRef.current, placed);
    const size = { width: placed.rect.width, height: placed.rect.height };
    return { rect: { x: topLeft.x, y: topLeft.y, ...size }, bounds: placed.frame.bounds };
  }

  function drop(event: MouseEvent): void {
    press.current = null;
    setDragging(false);
    rebase();
    report("dragend", event.x, event.y);
    latest.current.onDrop(droppedForm());
  }

  function handleMouseDown(event: MouseEvent): void {
    if (event.button !== "left") return;
    press.current = {
      x: event.x,
      y: event.y,
      offsetAtPress: rebase(),
      lastX: event.x,
      lastY: event.y,
      shown: shown.current,
    };
    setDragging(true);
    report("dragstart", event.x, event.y);
  }

  /**
   * The host placed the form differently while the button was held (a
   * resize re-placed it): the travel so far was measured against the old
   * placement, so the drag goes on from the pointer's last cell and from
   * where the form is drawn now, without the excess the new clamp cut off.
   */
  function restartFromLastCell(started: Press): void {
    started.x = started.lastX;
    started.y = started.lastY;
    started.offsetAtPress = rebase();
    started.shown = shown.current;
  }

  function handleMouseMove(event: MouseEvent): void {
    const started = press.current;
    if (started === null) return;
    if (event.button !== "left") {
      drop(event);
      return;
    }
    if (!sameReference(started.shown, shown.current)) restartFromLastCell(started);
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

  function moveBy(dx: number, dy: number): void {
    if (!enabled) return;
    const current = rebase();
    const target = drawnOffset({ x: current.x + dx, y: current.y + dy }, shown.current);
    // Against the edge of the bounds that way: the move would draw nothing new.
    if (sameOffset(target, current)) return;
    const from = drawnTopLeft(current, shown.current);
    const to = drawnTopLeft(target, shown.current);
    report("dragstart", from.x, from.y);
    apply(target);
    report("drag", to.x, to.y);
    report("dragend", to.x, to.y);
    latest.current.onDrop(droppedForm());
  }

  function onPlaced(rect: CellRect | null, frame: PlacedFrame | null): void {
    // A null comes while the form is re-measured too: keep the last placement it showed with.
    if (rect !== null) shown.current = { rect, frame };
  }

  function setOrigin(origin: DragOffset): void {
    const placed = shown.current;
    if (placed === null || placed.frame === null) return;
    const topLeft = drawnTopLeft(rebase(), placed);
    // Until the host reports the new placement, moves are measured from the new origin.
    shown.current = { rect: placed.rect, frame: { origin, bounds: placed.frame.bounds } };
    apply({ x: topLeft.x - origin.x, y: topLeft.y - origin.y });
  }

  function resetOffset(): void {
    apply(NO_OFFSET);
  }

  const handlers: MouseHandlers = enabled
    ? { onMouseDown: handleMouseDown, onMouseMove: handleMouseMove, onMouseUp: handleMouseUp }
    : NO_HANDLERS;
  return {
    offset,
    isDragging: enabled && isDragging,
    moveBy,
    handlers,
    onPlaced,
    setOrigin,
    resetOffset,
  };
}
