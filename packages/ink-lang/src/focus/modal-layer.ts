import { createContext, useContext } from "react";

/**
 * The open modal layers of a focus scope (or of a renderer without one),
 * innermost last. While a layer is open, only focus stops and mouse targets
 * inside it react; everything on the page (layer null), the host's own stops
 * and the layers below is inert.
 */
export interface ModalLayers {
  /** The id of the innermost open layer, or null when no modal is open. */
  activeLayer: string | null;
  /**
   * Opens a layer whose `onCancel` runs when it is cancelled on top of the
   * stack (Escape, through `cancelActive`); the returned function closes it.
   */
  open: (id: string, onCancel: () => void) => () => void;
  /** Runs the innermost open layer's `onCancel`; false when no layer is open. */
  cancelActive: () => boolean;
  /**
   * The place of the layer `id` in the stack, bottom first, read at call
   * time: -1 for the page (null), below every modal; the stack's length for
   * an id that is not open (a layer still opening), above every open one.
   */
  indexOf: (id: string | null) => number;
}

function noLayer(): () => void {
  return function close() {};
}

function cancelNothing(): boolean {
  return false;
}

function pageOrOpening(id: string | null): number {
  return id === null ? -1 : 0;
}

/** The layers when nothing provides them: none is ever open. */
export const NO_MODAL_LAYERS: ModalLayers = {
  activeLayer: null,
  open: noLayer,
  cancelActive: cancelNothing,
  indexOf: pageOrOpening,
};

export const ModalLayerContext = createContext<ModalLayers>(NO_MODAL_LAYERS);

/** The layer the current subtree belongs to: null for the page, a modal's id inside it. */
export const LayerIdContext = createContext<string | null>(null);

/** True when the current subtree may react: no modal is open, or the innermost one is ours. */
export function useLayerIsActive(): boolean {
  const layers = useContext(ModalLayerContext);
  const layer = useContext(LayerIdContext);
  return layers.activeLayer === layer;
}
