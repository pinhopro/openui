import type { DOMElement } from "ink";
import { useContext, useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import type { CellRect } from "../focus/element-rect";
import { LayerIdContext } from "../focus/modal-layer";
import { useCapturedContexts } from "./context-bridge";
import type { OverlayPlacement } from "./overlay-placement";
import { OverlayRegistryContext, type Overlay, type OverlayKind } from "./overlay-registry";

export interface UseOverlayOptions {
  /**
   * The overlay's id, for an owner that needs it before this call (a dialog
   * tells its layer which overlay its stops render in); default one of its own.
   */
  id?: string;
  kind: OverlayKind;
  /**
   * The box the overlay is placed against; nothing is drawn while it is
   * missing, empty or clipped out, except for a `cover` or `center` overlay,
   * which is placed in the bounds whatever its anchor. An absolute box that
   * takes no cells marks a declaration: the overlay is placed against the
   * line where it was declared (`declarationLine`).
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
  /**
   * The modal layer the overlay belongs to, which decides its stacking: a
   * modal passes its own layer id for its backdrop and its box; default the
   * layer this component renders in (`LayerIdContext`, null on the page).
   */
  layer?: string | null;
  /**
   * Cells added to the shown form's placed position, `x` to the right and `y`
   * down (a dragged dialog's displacement); default none. The moved form is
   * clamped into the bounds (`clampIntoBounds`), so it never leaves them; a
   * `cover` overlay ignores it. A new offset is drawn on the next render.
   */
  offset?: { x: number; y: number };
  /**
   * Called by the host, outside render, whenever the cells the shown form
   * takes change, with those cells in the ink root's coordinates (the compact
   * form's while it shows, else the whole one's); null while nothing shows
   * (the anchor is missing or clipped out) and once the overlay closes. The
   * same cells are never reported twice in a row.
   */
  onPlaced?: (rect: CellRect | null) => void;
}

export interface OverlayHandle {
  id: string;
}

const NO_OFFSET = Object.freeze({ x: 0, y: 0 });

/**
 * Floats `render()` over the program, placed against `anchorRef`, while
 * `isOpen`: the overlay joins the nearest overlay registry on top of the
 * overlays of its layer (`layer`), and its content is rendered by the registry's host with the contexts
 * this component renders in. It is re-sent to the host after every render of
 * this component, so the content and the bridged contexts stay current.
 * Outside any registry it does nothing.
 */
export function useOverlay(options: UseOverlayOptions): OverlayHandle {
  const ownId = useId();
  const id = options.id ?? ownId;
  const registry = useContext(OverlayRegistryContext);
  const captured = useCapturedContexts();
  const ownerLayer = useContext(LayerIdContext);
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
    offset: options.offset ?? NO_OFFSET,
    onPlaced: options.onPlaced ?? null,
    layer: options.layer === undefined ? ownerLayer : options.layer,
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
