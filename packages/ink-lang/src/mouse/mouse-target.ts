import type { DOMElement } from "ink";
import type { RefObject } from "react";
import type { MouseEvent, WheelDirection } from "./mouse-sequence";

/** Wheel ticks over one target, coalesced per event-loop turn. */
export interface MouseWheelEvent {
  direction: WheelDirection;
  /** How many ticks in this direction arrived together (at least 1). */
  ticks: number;
  x: number;
  y: number;
  shift: boolean;
  alt: boolean;
  ctrl: boolean;
}

export type MouseEventHandler = (event: MouseEvent) => void;
export type MouseWheelHandler = (event: MouseWheelEvent) => void;

/** What a component can listen to on the box it registers with `useMouse`. */
export interface MouseHandlers {
  onMouseDown?: MouseEventHandler;
  onMouseUp?: MouseEventHandler;
  /** Left button pressed and released on the same target. */
  onClick?: MouseEventHandler;
  /** A second click on the same target within `DOUBLE_CLICK_MS`, after that click. */
  onDoubleClick?: MouseEventHandler;
  /** Right button released on the target. */
  onContextMenu?: MouseEventHandler;
  onMouseMove?: MouseEventHandler;
  /** The pointer moved onto the target (derived from consecutive moves). */
  onMouseEnter?: MouseEventHandler;
  /** The pointer moved off the target (derived from consecutive moves). */
  onMouseLeave?: MouseEventHandler;
  onWheel?: MouseWheelHandler;
}

/** One registered box: the Ink element it points at and the handlers to call. */
export interface MouseTarget {
  ref: RefObject<DOMElement | null>;
  handlers: MouseHandlers;
}
