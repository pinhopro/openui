import type { DOMElement } from "ink";
import { useContext, useEffect, type RefObject } from "react";
import { OverlayPriorityContext } from "../focus/overlay-priority";
import { useMouse, type UseMouseOptions } from "../mouse/use-mouse";

export interface PriorityTrackerProps {
  /** The dialog overlay's id, what `hovered` is set to. */
  overlayId: string;
  /** The form's box: the pointer anywhere on its cells (over its buttons too) is inside the dialog. */
  boxRef: RefObject<DOMElement | null>;
}

const HOVER_WITHIN: UseMouseOptions = { hoverWithin: true };

/**
 * Put in a shown form of a non-modal dialog: sets the hovered overlay
 * (`OverlayPriorityContext`) to the dialog while the pointer is over any
 * cell of its box and nothing painted later covers that cell, and clears it
 * when the pointer leaves or the form goes away (closed, or hidden for a
 * re-measure). The box is a hover-within target (`UseMouseOptions`), so the
 * targets inside it, and the shield on the same box, keep their own events.
 * Without the mouse on it never sets anything. Renders nothing.
 */
export function PriorityTracker({ overlayId, boxRef }: PriorityTrackerProps) {
  const priority = useContext(OverlayPriorityContext);
  const setHovered = priority.setHovered;
  const clearHovered = priority.clearHovered;
  useMouse(
    boxRef,
    {
      onMouseEnter: function enterDialog() {
        setHovered(overlayId);
      },
      onMouseLeave: function leaveDialog() {
        clearHovered(overlayId);
      },
    },
    HOVER_WITHIN,
  );
  useEffect(
    function clearOnUnmount() {
      return function forgetHover() {
        clearHovered(overlayId);
      };
    },
    [clearHovered, overlayId],
  );
  return null;
}
