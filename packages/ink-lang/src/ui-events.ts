import { createContext, useContext } from "react";
import type { MouseButton, WheelDirection } from "./mouse/mouse-sequence";

/** The browser-like events a host can observe through `InkRenderer`'s `onUiEvent`. */
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
  | "wheel";

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
