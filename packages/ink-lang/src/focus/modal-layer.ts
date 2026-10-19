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
  /** Opens a layer; the returned function closes it. */
  open: (id: string) => () => void;
}

function noLayer(): () => void {
  return function close() {};
}

/** The layers when nothing provides them: none is ever open. */
export const NO_MODAL_LAYERS: ModalLayers = { activeLayer: null, open: noLayer };

export const ModalLayerContext = createContext<ModalLayers>(NO_MODAL_LAYERS);

/** The layer the current subtree belongs to: null for the page, a modal's id inside it. */
export const LayerIdContext = createContext<string | null>(null);

/** True when the current subtree may react: no modal is open, or the innermost one is ours. */
export function useLayerIsActive(): boolean {
  const layers = useContext(ModalLayerContext);
  const layer = useContext(LayerIdContext);
  return layers.activeLayer === layer;
}
