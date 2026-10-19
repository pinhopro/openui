import type { DOMElement } from "ink";
import { createContext, type ReactNode, type RefObject } from "react";
import type { CellRect } from "../focus/element-rect";
import type { CapturedContexts } from "./context-bridge";
import type { OverlayPlacement } from "./overlay-placement";

/**
 * What an overlay is: a hint, a dialog that leaves the base interactive, a
 * modal, or the see-through backdrop under a modal (a cover overlay whose
 * click cancels the modal).
 */
export type OverlayKind = "tooltip" | "dialog" | "modal" | "backdrop";

/** One open overlay, as `useOverlay` registers it. */
export interface Overlay {
  id: string;
  kind: OverlayKind;
  /** The box the overlay is placed against; nothing is drawn while it is null or empty. */
  anchorRef: RefObject<DOMElement | null>;
  /** Where it goes against its anchor; `cover` spans the bounds whatever the anchor. */
  placement: OverlayPlacement;
  /** Empty cells between the anchor and the overlay. */
  gap: number;
  /** The overlay's content; called by the host on every one of its renders. */
  render: () => ReactNode;
  /**
   * A one-row form of the content, shown beside the anchor instead of
   * `render()` when the whole overlay does not fit (`overlayFits`); null when
   * the overlay has none.
   */
  renderCompact: (() => ReactNode) | null;
  /** Blank cells are painted under the content, so nothing shows through its empty cells. */
  opaque: boolean;
  /** The owner's contexts on its latest render, re-provided around `render()`. */
  captured: CapturedContexts;
  /**
   * Added to the shown form's placed position (a dragged dialog's
   * displacement), which is then clamped into the bounds (`clampIntoBounds`);
   * a cover form ignores it.
   */
  offset: { x: number; y: number };
  /**
   * Told the cells the shown form takes, in the ink root's cells (the compact
   * form's while it shows, else the whole one's), whenever they change; null
   * while nothing shows (the anchor is gone, the form is still being measured)
   * and once the overlay closes. Null when the owner does not listen.
   */
  onPlaced: ((rect: CellRect | null) => void) | null;
  /**
   * The modal layer the overlay belongs to (a modal's id for its own backdrop
   * and box, the layer its owner renders in otherwise; null for the page).
   * The host stacks overlays by their layer's place among the open modals
   * first (`stackingOrder`), so one of a layer under the active modal never
   * paints over it.
   */
  layer: string | null;
}

export interface OverlayRegistry {
  /** Adds an overlay on top of the stack; returns its removal. */
  register: (overlay: Overlay) => () => void;
  /** Replaces the registered overlay with the same id, keeping its place in the stack. */
  update: (overlay: Overlay) => void;
  /** Calls `listener` after every register, update and removal; returns the unsubscribe. */
  subscribe: (listener: () => void) => () => void;
  /** The open overlays in registration order, bottom first (the host stacks them by layer first). */
  list: () => Overlay[];
}

/** The registry overlays join; provided by `FocusScope`, else by each `InkRenderer`. */
export const OverlayRegistryContext = createContext<OverlayRegistry | null>(null);

/** The overlays in registration order, as an array nobody can change. */
function frozenList(overlays: Map<string, Overlay>): Overlay[] {
  const list = Array.from(overlays.values());
  Object.freeze(list);
  return list;
}

/**
 * A registry of open overlays, keyed by id in registration order (a Map keeps
 * an updated key in its place); the list is a frozen snapshot rebuilt on each
 * change, so `useSyncExternalStore` sees a new value only when something changed.
 */
export function createOverlayRegistry(): OverlayRegistry {
  const overlays = new Map<string, Overlay>();
  const listeners = new Set<() => void>();
  let snapshot = frozenList(overlays);

  function changed(): void {
    snapshot = frozenList(overlays);
    for (const listener of Array.from(listeners)) listener();
  }

  function register(overlay: Overlay): () => void {
    overlays.set(overlay.id, overlay);
    changed();
    return function unregister() {
      if (!overlays.delete(overlay.id)) return;
      changed();
    };
  }

  function update(overlay: Overlay): void {
    const current = overlays.get(overlay.id);
    if (current === undefined || current === overlay) return;
    overlays.set(overlay.id, overlay);
    changed();
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return function unsubscribe() {
      listeners.delete(listener);
    };
  }

  function list(): Overlay[] {
    return snapshot;
  }

  return { register, update, subscribe, list };
}
