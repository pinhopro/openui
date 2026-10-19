import { createContext } from "react";
import type { FocusEntry } from "./focus-registry";

/**
 * Which overlay the pointer is over, for the priority of a non-modal dialog:
 * while the pointer is inside a dialog's box, Tab and the arrows stay inside
 * it. Kept by `FocusScope` (or by a standalone `InkRenderer`) and set by the
 * `PriorityTracker` of each shown dialog form.
 */
export interface OverlayPriorityState {
  /** The id of the dialog overlay under the pointer; null when the pointer is over none. */
  hovered: string | null;
  /** The pointer entered the overlay `id` (null: it is over none). */
  setHovered: (id: string | null) => void;
  /**
   * The pointer left the overlay `id`, or its form is gone: clears `hovered`
   * only while it is `id`, so a dialog that closes never clears another
   * one's hover.
   */
  clearHovered: (id: string) => void;
}

function ignoreHover(): void {}

/** The state when nothing keeps it: no overlay is ever hovered. */
export const NO_OVERLAY_PRIORITY: OverlayPriorityState = {
  hovered: null,
  setHovered: ignoreHover,
  clearHovered: ignoreHover,
};

export const OverlayPriorityContext = createContext<OverlayPriorityState>(NO_OVERLAY_PRIORITY);

/**
 * The overlay that has priority (Tab and the arrows cycle inside it): the
 * overlay of the focused stop when it renders in one, else the hovered one;
 * null when neither holds. Focus wins over the pointer, so a dialog whose
 * stop has focus keeps priority while the pointer rests on another one.
 */
export function priorityOverlay(hovered: string | null, active: FocusEntry | null): string | null {
  if (active !== null && active.overlay !== null) return active.overlay;
  return hovered;
}
