import { createContext, useContext } from "react";
import type { MouseButton, WheelDirection } from "./mouse/mouse-sequence";

/**
 * The browser-like events a host can observe through `InkRenderer`'s
 * `onUiEvent`. `open` and `close` report a dialog layer shown and hidden,
 * `cancel` a dialog dismissed (Escape, a backdrop click, its cancel or close
 * control); each carries the dialog's type and title. `dragstart`, `drag`
 * and `dragend` report a dialog moved by its title bar (a press, each move
 * that moved it, the release, at the pointer's cell) or by Ctrl+arrows (all
 * three for each key that moves it, at the dialog's top-left cell before
 * and after).
 */
export type UiEventType =
  | "focus"
  | "blur"
  | "keydown"
  | "keyup"
  | "input"
  | "change"
  | "mousedown"
  | "mouseup"
  | "click"
  | "dblclick"
  | "contextmenu"
  | "mouseenter"
  | "mouseleave"
  | "mousemove"
  | "wheel"
  | "cancel"
  | "open"
  | "close"
  | "dragstart"
  | "drag"
  | "dragend";

/** One event: which component instance it happened on and the details that apply. */
export interface UiEvent {
  type: UiEventType;
  /** The component type (`Button`, `Input`...), or an empty string when none applies. */
  component: string;
  /** What identifies the instance: a field name, a label, a trigger text; may be empty. */
  name: string;
  /** Mouse events: the 0-based cell. */
  x?: number;
  y?: number;
  button?: MouseButton;
  shift?: boolean;
  alt?: boolean;
  ctrl?: boolean;
  /** Wheel events. */
  direction?: WheelDirection;
  ticks?: number;
  /** Key events: `Tab`, `Enter`, `ArrowUp`, `a`, `ctrl+n`... */
  key?: string;
  /** Input and change events: the new value. */
  value?: unknown;
}

export type UiEventListener = (event: UiEvent) => void;

export const UiEventContext = createContext<UiEventListener | null>(null);

function ignore(): void {}

/** The listener components report to; a no-op when the host passed no `onUiEvent`. */
export function useUiEvents(): UiEventListener {
  const listener = useContext(UiEventContext);
  return listener === null ? ignore : listener;
}
