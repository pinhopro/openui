import type { DOMElement } from "ink";
import { anchorBehind } from "../focus/anchor-behind";
import type { CellPoint } from "../focus/element-rect";
import { focusOrder } from "../focus/focus-order";
import type { FocusEntry, FocusRegistry } from "../focus/focus-registry";
import { placedOrigin } from "../overlay/overlay-measure";
import { alwaysClamped, type OverlayPlacement } from "../overlay/overlay-placement";
import type { DroppedForm } from "../overlay/use-drag";

/**
 * How a dialog re-anchored to a stop is placed against it: from the stop's
 * top-left cell, never flipped or shifted (`anchor`), so its offset from that
 * cell is what places it, and the same offset puts it in the same place
 * against the stop after a resize or a change of the content around the
 * stop; only the clamp into the bounds can move it (`movedPosition`).
 */
export const ANCHORED_PLACEMENT: OverlayPlacement = "anchor";

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
  origin: CellPoint;
  /** Its form is clamped into the bounds with no offset too (`alwaysClamped`). */
  alwaysClamped: boolean;
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
  const placement = stop === null ? input.placement : ANCHORED_PLACEMENT;
  const origin = placedOrigin({
    anchor: stop === null ? input.declaration : stop.ref.current,
    placement,
    gap: 0,
    size: { width: rect.width, height: rect.height },
    bounds: input.dropped.bounds,
  });
  if (origin === null) return null;
  return {
    stopId: stop === null ? null : stop.id,
    origin,
    alwaysClamped: alwaysClamped(placement),
  };
}
