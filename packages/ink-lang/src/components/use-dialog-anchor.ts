import type { DOMElement } from "ink";
import { useContext, useEffect, useRef, useState, type RefObject } from "react";
import type { CellRect } from "../focus/element-rect";
import { FocusRegistryContext } from "../focus/focus-registry";
import { useSequencePath } from "../focus/sequence-path";
import type { OverlayPlacement } from "../overlay/overlay-placement";
import type { PlacedFrame } from "../overlay/overlay-registry";
import type { DragOffset, DragState, DroppedForm } from "../overlay/use-drag";
import { ANCHORED_PLACEMENT, liveAnchor, reanchorOnDrop } from "./dialog-anchor";

export interface DialogAnchorOptions {
  /** A dropped dialog re-anchors (a non-modal one); false keeps its tree anchor always. */
  enabled: boolean;
  /** The box marking the dialog's declaration: its tree anchor. */
  declarationRef: RefObject<DOMElement | null>;
  /** The dialog's own placement against its declaration. */
  placement: OverlayPlacement;
  /** The dialog's drag: its offset is rebased whenever the anchor changes. */
  drag: DragState;
}

export interface DialogAnchor {
  /** The overlay's anchor: the anchor stop's box, else the declaration. */
  anchorRef: RefObject<DOMElement | null>;
  /** The overlay's placement against `anchorRef`. */
  placement: OverlayPlacement;
  /** The overlay's offset. */
  offset: DragOffset;
  /**
   * The sequence path the dialog's content renders under: one level below
   * the anchor stop's, at `AFTER_ANCHOR` (its stops then sort right after
   * that stop), else its declaration's.
   */
  path: number[];
  /** The anchor stop's id, for `OverlayAnchorContext`; null on the tree anchor. */
  stopId: string | null;
  /** `useDrag`'s `onDrop`: re-anchors to the stop behind the dropped dialog. */
  drop: (dropped: DroppedForm | null) => void;
  /** The overlay's `onPlaced`: tells the drag, and falls back once the anchor stop is gone. */
  onPlaced: (rect: CellRect | null, frame: PlacedFrame | null) => void;
}

const NO_OFFSET: DragOffset = Object.freeze({ x: 0, y: 0 });

/**
 * The level a re-anchored dialog's content renders at under its anchor
 * stop's path: below every order a component hands out (0 and up), so the
 * dialog's stops sort right after the stop and before anything the stop's
 * own component nests under it (an open accordion section under its header,
 * whose content sits at `[...header, 0, ...]`).
 */
const AFTER_ANCHOR = -1;

/**
 * Where a dialog is anchored. It starts at its tree anchor (its declaration,
 * at its own placement, its stops in the Tab cycle where it is declared). On
 * each drop it re-anchors to the stop behind its top-left cell
 * (`reanchorOnDrop`): it is then placed from that stop's top-left cell
 * (`ANCHORED_PLACEMENT`), its offset rebased so it does not move, and its
 * stops sort right after that stop; the anchor is kept as the stop's id, so
 * a resize moves the dialog with its stop, at the same offset from it
 * (clamped into the bounds). Never during a drag. Once that
 * stop is gone (unregistered or unmounted, noticed when the dialog renders
 * or when the host can no longer place it) the dialog falls back to its tree
 * anchor with no offset. The anchor is kept while the dialog is closed, as
 * its offset is: it reopens where it was left, when that stop still exists.
 */
export function useDialogAnchor(options: DialogAnchorOptions): DialogAnchor {
  const registry = useContext(FocusRegistryContext);
  const declarationPath = useSequencePath();
  const [stopId, setStopId] = useState<string | null>(null);
  const drag = options.drag;
  const dragRef = useRef(drag);
  dragRef.current = drag;
  const anchored = options.enabled ? liveAnchor(registry, stopId) : null;
  const lost = stopId !== null && anchored === null;

  function forgetAnchor(): void {
    setStopId(null);
    dragRef.current.resetOffset();
  }

  useEffect(
    function fallBackWhenLost() {
      if (lost) forgetAnchor();
    },
    // Only a change of `lost` matters: `forgetAnchor` reads the drag through a ref.
    [lost],
  );

  function drop(dropped: DroppedForm | null): void {
    if (!options.enabled || registry === null || dropped === null) return;
    const next = reanchorOnDrop({
      registry,
      dropped,
      declaration: options.declarationRef.current,
      placement: options.placement,
    });
    if (next === null) return;
    setStopId(next.stopId);
    dragRef.current.setOrigin(next.origin, next.alwaysClamped);
  }

  function onPlaced(rect: CellRect | null, frame: PlacedFrame | null): void {
    dragRef.current.onPlaced(rect, frame);
    // Nothing shows once the anchor stop unmounts; a re-measure or a clipped stop is no loss.
    if (rect === null && stopId !== null && liveAnchor(registry, stopId) === null) forgetAnchor();
  }

  if (anchored === null) {
    return {
      anchorRef: options.declarationRef,
      placement: options.placement,
      // A lost anchor's offset is measured from it: none until the fallback resets it.
      offset: lost ? NO_OFFSET : drag.offset,
      path: declarationPath,
      stopId: null,
      drop,
      onPlaced,
    };
  }
  return {
    anchorRef: anchored.ref,
    placement: ANCHORED_PLACEMENT,
    offset: drag.offset,
    path: anchored.path === null ? declarationPath : anchored.path.concat(AFTER_ANCHOR),
    stopId: anchored.id,
    drop,
    onPlaced,
  };
}
