import type { FocusEntry, FocusRegistry } from "./focus-registry";
import { priorityOverlay } from "./overlay-priority";

/** What the navigator knows on a key about which overlay has priority. */
export interface PriorityInput {
  /** The dialog overlay under the pointer (`OverlayPriorityState.hovered`). */
  hovered: string | null;
  /**
   * The overlays whose priority by focus Escape ended: a stop of theirs that
   * has focus (reached again by Tab, say) gives no priority, so the dialog
   * keeps its place in the page's cycle. An overlay leaves the set once the
   * pointer enters it or it opens again (`focusFirstIn`).
   */
  released: Set<string>;
}

/** True when a stop that can take focus right now renders in the overlay `overlay`. */
function hasActiveStopIn(registry: FocusRegistry, overlay: string): boolean {
  for (const entry of registry.entries()) {
    if (entry.isActive && entry.overlay === overlay) return true;
  }
  return false;
}

/** The focused stop when it gives its overlay priority: it renders in one Escape has not released. */
function focusHolder(input: PriorityInput, active: FocusEntry | null): FocusEntry | null {
  if (active === null || active.overlay === null) return null;
  return input.released.has(active.overlay) ? null : active;
}

/**
 * The overlay that keeps Tab and the arrows inside it right now, or null:
 * `priorityOverlay` of the hovered dialog and the focused stop (`active`),
 * unless Escape released the focused stop's overlay. An overlay with no stop
 * that can take focus (a dialog without buttons, one under a modal) holds
 * nothing, so the keys never stall.
 */
export function heldPriority(
  registry: FocusRegistry,
  input: PriorityInput,
  active: FocusEntry | null,
): string | null {
  const priority = priorityOverlay(input.hovered, focusHolder(input, active));
  if (priority === null || !hasActiveStopIn(registry, priority)) return null;
  return priority;
}

/**
 * What Escape does about priority, once no stop claims it and no modal took
 * it: true when an overlay has priority only because the pointer is over it
 * (Escape then leaves focus alone); otherwise, when the focused stop's
 * overlay has priority, that overlay is released, and false is returned
 * (the navigator drops focus as usual).
 */
export function escapeKeepsFocus(
  registry: FocusRegistry,
  input: PriorityInput,
  active: FocusEntry | null,
): boolean {
  const priority = heldPriority(registry, input, active);
  if (priority === null) return false;
  if (active === null || active.overlay !== priority) return true;
  input.released.add(priority);
  return false;
}
