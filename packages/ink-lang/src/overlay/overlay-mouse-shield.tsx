import type { DOMElement } from "ink";
import type { RefObject } from "react";
import type { MouseHandlers } from "../mouse/mouse-target";
import { useMouse, type UseMouseOptions } from "../mouse/use-mouse";

export interface OverlayMouseShieldProps {
  /** The overlay's box: presses and clicks on any of its cells stop there. */
  boxRef: RefObject<DOMElement | null>;
}

function absorb(): void {}

/**
 * Presses, releases and clicks are taken; moves and the wheel are not, so the
 * pointer leaving a trigger for its bubble still reads as leaving the trigger,
 * and the wheel still scrolls what is underneath.
 */
const ABSORBED: MouseHandlers = {
  onMouseDown: absorb,
  onMouseUp: absorb,
  onClick: absorb,
  onDoubleClick: absorb,
  onContextMenu: absorb,
};

const OCCLUDER: UseMouseOptions = { occluder: true };

/**
 * Makes an overlay's box a mouse target in the overlay's layer that does
 * nothing, so a click on a cell it paints over never reaches the hidden base
 * component (or the backdrop) under it, whichever modal layer is open.
 * Targets inside the content are deeper in the same layer and still get
 * their events first. Renders nothing.
 */
export function OverlayMouseShield({ boxRef }: OverlayMouseShieldProps) {
  useMouse(boxRef, ABSORBED, OCCLUDER);
  return null;
}
