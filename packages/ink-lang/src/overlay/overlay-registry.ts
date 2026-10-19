import type { DOMElement } from "ink";
import { createContext, type ReactNode, type RefObject } from "react";
import type { CapturedContexts } from "./context-bridge";
import type { OverlayPlacement } from "./overlay-placement";

/** What an overlay is: a hint, a dialog that leaves the base interactive, or a modal. */
export type OverlayKind = "tooltip" | "dialog" | "modal";

/** One open overlay, as `useOverlay` registers it. */
export interface Overlay {
  id: string;
  kind: OverlayKind;
  /** The box the overlay is placed against; nothing is drawn while it is null or empty. */
  anchorRef: RefObject<DOMElement | null>;
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
  /** Added to the placed position (a dragged dialog's displacement). */
  offset: { x: number; y: number };
}

export interface OverlayRegistry {
  /** Adds an overlay on top of the stack; returns its removal. */
  register: (overlay: Overlay) => () => void;
  /** Replaces the registered overlay with the same id, keeping its place in the stack. */
  update: (overlay: Overlay) => void;
  /** Calls `listener` after every register, update and removal; returns the unsubscribe. */
  subscribe: (listener: () => void) => () => void;
  /** The open overlays in stacking order (registration order), bottom first. */
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
