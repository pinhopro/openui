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
   * pointer enters it, once one of its stops takes focus while the pointer is
   * over it (`rearmHoveredFocus`), or once it opens again (`focusFirstIn`).
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

/**
 * The focused stop when it gives its overlay priority: it renders in one
 * Escape has not released.
 */
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
 * What Escape does first, once no stop claims it: when the focused stop's
 * overlay has priority and is not the active modal layer's own overlay (a
 * non-modal dialog, on the page or inside a modal), that overlay is released
 * and true is returned: the navigator drops focus and the Escape ends there,
 * so a dialog inside a modal is released before the modal is cancelled.
 * False otherwise (a modal's own stop has focus, or none of a dialog's).
 * `activeLayer` is the id of the innermost open modal layer, which is also
 * the id of the modal's own overlay; null when no modal is open.
 */
export function releaseFocusedPriority(
  registry: FocusRegistry,
  input: PriorityInput,
  active: FocusEntry | null,
  activeLayer: string | null,
): boolean {
  const priority = heldPriority(registry, input, active);
  if (priority === null || active === null || active.overlay !== priority) return false;
  if (priority === activeLayer) return false;
  input.released.add(priority);
  return true;
}

/**
 * What Escape does last, once no stop claims it, no focused dialog was
 * released and no modal took it: true when an overlay has priority only
 * because the pointer is over it (Escape then leaves focus alone); false
 * otherwise (the navigator drops focus).
 */
export function hoverKeepsFocus(
  registry: FocusRegistry,
  input: PriorityInput,
  active: FocusEntry | null,
): boolean {
  const priority = heldPriority(registry, input, active);
  if (priority === null) return false;
  return active === null || active.overlay !== priority;
}

/**
 * Gives a released overlay its priority by focus back once one of its stops
 * has focus while the pointer is over it (the pointer focused one of its
 * buttons, say). Escape's own drop leaves no stop focused, so it never undoes
 * the release it just made.
 */
export function rearmHoveredFocus(input: PriorityInput, active: FocusEntry | null): void {
  const hovered = input.hovered;
  if (hovered === null || active === null || active.overlay !== hovered) return;
  input.released.delete(hovered);
}
