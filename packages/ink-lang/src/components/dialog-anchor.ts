import type { DOMElement } from "ink";
import { anchorBehind } from "../focus/anchor-behind";
import { focusOrder } from "../focus/focus-order";
import type { FocusEntry, FocusRegistry } from "../focus/focus-registry";
import { placedOrigin } from "../overlay/overlay-measure";
import type { OverlayPlacement, OverlayPosition } from "../overlay/overlay-placement";
import type { DroppedForm } from "../overlay/use-drag";

/**
 * How a dialog re-anchored to a stop is placed against it: right under it,
 * with no gap. Its offset then keeps it where it was dropped, so the
 * placement only matters as the reference the offset is measured from (a
 * `center` placement would ignore the stop altogether).
 */
export const ANCHORED_PLACEMENT: OverlayPlacement = "bottom";

/**
 * The stop `id` while it can still anchor a dialog: registered and mounted
 * (whether it can take focus right now does not matter: a stop is inactive
 * while the program streams or a modal is open above it). Null for a null
 * id and for a stop that is gone (its tab closed, its list re-rendered).
 */
export function liveAnchor(registry: FocusRegistry | null, id: string | null): FocusEntry | null {
  if (registry === null || id === null) return null;
  const entry = registry.find(id);
  if (entry === null || entry.ref.current === null) return null;
  return entry;
}

export interface ReanchorInput {
  registry: FocusRegistry;
  /** Where the dialog was dropped. */
  dropped: DroppedForm;
  /** The box marking the dialog's declaration: its tree anchor. */
  declaration: DOMElement | null;
  /** The dialog's own placement against its declaration. */
  placement: OverlayPlacement;
}

/** The anchor a dropped dialog takes, and where the host places it against that anchor. */
export interface Reanchor {
  /** The stop it is anchored to; null for its tree anchor (its declaration). */
  stopId: string | null;
  /** Where its form is placed against that anchor, before its offset. */
  origin: OverlayPosition;
}

/**
 * The anchor of a dialog dropped at `dropped`: the base stop behind its
 * top-left cell (`anchorBehind` over the Tab order), placed against with
 * `ANCHORED_PLACEMENT`; its declaration, at its own placement, when no stop
 * comes before that cell. Null when the dialog could not be drawn against
 * that anchor (its cells are missing or clipped out): it keeps the one it has.
 */
export function reanchorOnDrop(input: ReanchorInput): Reanchor | null {
  const rect = input.dropped.rect;
  const stopId = anchorBehind({ x: rect.x, y: rect.y }, focusOrder(input.registry));
  const stop = liveAnchor(input.registry, stopId);
  const origin = placedOrigin({
    anchor: stop === null ? input.declaration : stop.ref.current,
    placement: stop === null ? input.placement : ANCHORED_PLACEMENT,
    gap: 0,
    size: { width: rect.width, height: rect.height },
    bounds: input.dropped.bounds,
  });
  if (origin === null) return null;
  return { stopId: stop === null ? null : stop.id, origin };
}
