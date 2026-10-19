import type { DOMElement } from "ink";
import { useContext, useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { useCapturedContexts } from "./context-bridge";
import type { OverlayPlacement } from "./overlay-placement";
import { OverlayRegistryContext, type Overlay, type OverlayKind } from "./overlay-registry";

export interface UseOverlayOptions {
  kind: OverlayKind;
  /**
   * The box the overlay is placed against; nothing is drawn while it is
   * missing, empty or clipped out, even for a `cover` overlay.
   */
  anchorRef: RefObject<DOMElement | null>;
  /** Where it goes against its anchor; `cover` spans the bounds (a backdrop). */
  placement: OverlayPlacement;
  /** Empty cells between the anchor and the overlay; default 0. */
  gap?: number;
  /** The overlay is registered (drawn) only while this is true. */
  isOpen: boolean;
  /** The overlay's content, rendered by the host with this component's contexts. */
  render: () => ReactNode;
  /**
   * A one-row form of the content (no hooks either), shown on the anchor's row
   * instead of `render()` when the whole overlay does not fit around it.
   */
  renderCompact?: () => ReactNode;
  /** Paint blank cells under the content so nothing shows through; default true. */
  opaque?: boolean;
}

export interface OverlayHandle {
  id: string;
}

const NO_OFFSET = Object.freeze({ x: 0, y: 0 });

/**
 * Floats `render()` over the program, placed against `anchorRef`, while
 * `isOpen`: the overlay joins the nearest overlay registry on top of the
 * stack, and its content is rendered by the registry's host with the contexts
 * this component renders in. It is re-sent to the host after every render of
 * this component, so the content and the bridged contexts stay current.
 * Outside any registry it does nothing.
 */
export function useOverlay(options: UseOverlayOptions): OverlayHandle {
  const id = useId();
  const registry = useContext(OverlayRegistryContext);
  const captured = useCapturedContexts();
  const isOpen = options.isOpen;
  const latest = useRef<Overlay | null>(null);
  latest.current = {
    id,
    kind: options.kind,
    anchorRef: options.anchorRef,
    placement: options.placement,
    gap: options.gap ?? 0,
    render: options.render,
    renderCompact: options.renderCompact ?? null,
    opaque: options.opaque ?? true,
    captured,
    offset: NO_OFFSET,
  };

  useEffect(
    function registerOverlay() {
      const overlay = latest.current;
      if (registry === null || !isOpen || overlay === null) return undefined;
      return registry.register(overlay);
    },
    [registry, isOpen],
  );

  // No dependencies: the latest content and contexts reach the host after every render.
  useEffect(function updateOverlay() {
    const overlay = latest.current;
    if (registry === null || !isOpen || overlay === null) return;
    registry.update(overlay);
  });

  return { id };
}
