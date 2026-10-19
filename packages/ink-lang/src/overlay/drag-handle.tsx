import type { DOMElement } from "ink";
import type { RefObject } from "react";
import type { MouseHandlers } from "../mouse/mouse-target";
import { useMouse } from "../mouse/use-mouse";

export interface DragHandleProps {
  /** The box that is dragged by (a dialog's title row). */
  handleRef: RefObject<DOMElement | null>;
  /** `useDrag`'s handlers. */
  handlers: MouseHandlers;
}

/**
 * Put inside an overlay's content next to the box behind `handleRef`: makes
 * that box the drag handle in the overlay's mouse layer, under its layer
 * rules (inert behind an open modal and while the form is only measured).
 * It is deeper than the overlay's mouse shield, so a press on it starts the
 * drag instead of being absorbed. Draws nothing.
 */
export function DragHandle({ handleRef, handlers }: DragHandleProps): null {
  useMouse(handleRef, handlers);
  return null;
}
