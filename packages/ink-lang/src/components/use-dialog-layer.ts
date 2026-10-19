import { useContext, useEffect, useRef } from "react";
import { ModalLayerContext } from "../focus/modal-layer";
import { useUiEvents, type UiEvent } from "../ui-events";

export interface DialogLayerOptions {
  /** The dialog is shown. */
  isOpen: boolean;
  /** It blocks everything behind it: it holds a modal layer while shown. */
  modal: boolean;
  /** What Escape runs while its layer is on top; the latest one is called. */
  onCancel: () => void;
  /** The layer's id, the value of `LayerIdContext` around the dialog's content. */
  layerId: string;
  /** The dialog's type (`Modal`, `ModalDialog`), reported in its UI events. */
  component: string;
  /** Its title, the `name` of its UI events. */
  title: string;
}

/**
 * A dialog's layer: while `isOpen && modal` it holds a modal layer whose
 * cancel (Escape, through the navigator) runs the latest `onCancel`, and it
 * reports `open` when the dialog shows and `close` when it hides or unmounts
 * while shown. Moving focus into the dialog once it shows is
 * `DialogFocusOnShow`'s job, inside the overlay content, where the shown
 * state is known.
 */
export function useDialogLayer(options: DialogLayerOptions): void {
  const layers = useContext(ModalLayerContext);
  const openLayer = layers.open;
  const emit = useUiEvents();
  const layerId = options.layerId;
  const isOpen = options.isOpen;
  const holdsLayer = isOpen && options.modal;
  // Read at call time, so a new handler or title on every render never reopens the layer.
  const latest = useRef(options);
  latest.current = options;
  const emitRef = useRef(emit);
  emitRef.current = emit;

  useEffect(
    function holdLayer() {
      if (!holdsLayer) return undefined;
      return openLayer(layerId, function cancelLatest() {
        latest.current.onCancel();
      });
    },
    [holdsLayer, layerId, openLayer],
  );

  useEffect(
    function reportOpenAndClose() {
      if (!isOpen) return undefined;
      emitRef.current(layerEvent("open", latest.current));
      return function reportClose() {
        emitRef.current(layerEvent("close", latest.current));
      };
    },
    [isOpen],
  );
}

/** An `open` or `close` event of the dialog. */
function layerEvent(type: "open" | "close", options: DialogLayerOptions): UiEvent {
  return { type, component: options.component, name: options.title };
}
