import { useFocusManager } from "ink";
import { useCallback, useContext, useEffect, useRef } from "react";
import { FocusRegistryContext, type FocusRegistry } from "../focus/focus-registry";
import { ModalLayerContext } from "../focus/modal-layer";
import { useUiEvents, type UiEvent } from "../ui-events";

export interface DialogLayerOptions {
  /** The dialog is shown. */
  isOpen: boolean;
  /**
   * It blocks everything behind it: it holds a modal layer while shown. A
   * non-modal dialog leaves the page interactive.
   */
  modal: boolean;
  /**
   * Cancelling closes the dialog (it has an `open` binding): further cancels
   * before it closes do nothing. False for a dialog that stays shown, whose
   * every cancel runs.
   */
  closesOnCancel: boolean;
  /** What a cancel runs; the latest one is called. */
  onCancel: () => void;
  /** The layer's id, the value of `LayerIdContext` around a modal dialog's content. */
  layerId: string;
  /** The id of the overlay the dialog's content renders in (what `useOverlay` returned). */
  overlayId: string;
  /** The dialog's type (`Modal`, `ModalDialog`, `Dialog`), reported in its UI events. */
  component: string;
  /** Its title, the `name` of its UI events. */
  title: string;
}

export interface DialogLayer {
  /**
   * Cancels the dialog: runs the latest `onCancel`, once per open for a
   * dialog that closes on cancel (Escape and a backdrop click read in one
   * input chunk cancel once). Stable; what the cancel controls, the backdrop
   * and the layer's Escape all call.
   */
  cancel: () => void;
}

/** True when `id` is a stop rendered in the overlay `overlayId`. */
function isStopIn(
  registry: FocusRegistry | null,
  id: string | undefined,
  overlayId: string,
): boolean {
  if (registry === null || id === undefined) return false;
  const entry = registry.find(id);
  return entry !== null && entry.overlay === overlayId;
}

/**
 * A dialog's layer: while `isOpen && modal` it holds a modal layer whose
 * cancel (Escape, through the navigator) is the dialog's `cancel`; it
 * reports `open` when the dialog shows and `close` when it hides or unmounts
 * while shown; and when the dialog closes it gives focus back to the stop
 * that had it when the dialog opened (the dialog's opener, or an outer
 * modal's stop), if that stop can still take focus. A non-modal dialog gives
 * it back only when one of its own stops had focus as it closed: focus moved
 * to the page on purpose stays there. Moving focus into the dialog once it
 * shows is `DialogFocusOnShow`'s job, inside the overlay content, where the
 * shown state is known.
 */
export function useDialogLayer(options: DialogLayerOptions): DialogLayer {
  const layers = useContext(ModalLayerContext);
  const openLayer = layers.open;
  const registry = useContext(FocusRegistryContext);
  const manager = useFocusManager();
  const emit = useUiEvents();
  const layerId = options.layerId;
  const isOpen = options.isOpen;
  const holdsLayer = isOpen && options.modal;
  // Read at call time, so a new handler or title on every render never reopens the layer.
  const latest = useRef(options);
  latest.current = options;
  const emitRef = useRef(emit);
  emitRef.current = emit;
  const managerRef = useRef(manager);
  managerRef.current = manager;
  const cancelled = useRef(false);

  const cancel = useCallback(function cancel(): void {
    if (cancelled.current) return;
    if (latest.current.closesOnCancel) cancelled.current = true;
    latest.current.onCancel();
  }, []);

  useEffect(
    function holdLayer() {
      if (!holdsLayer) return undefined;
      return openLayer(layerId, cancel);
    },
    [cancel, holdsLayer, layerId, openLayer],
  );

  useEffect(
    function giveFocusBackOnClose() {
      if (!isOpen) return undefined;
      const opener = managerRef.current.activeId;
      return function giveFocusBack() {
        // Read on the render that closes the dialog: its stops are still mounted.
        const focused = managerRef.current.activeId;
        const current = latest.current;
        if (!current.modal && !isStopIn(registry, focused, current.overlayId)) return;
        // The opener's layer becomes active once React re-renders; Ink only focuses an active id.
        setTimeout(function focusOpener() {
          if (opener === undefined || registry === null) return;
          const entry = registry.find(opener);
          if (entry !== null && entry.isActive) managerRef.current.focus(opener);
        }, 0);
      };
    },
    [isOpen, registry],
  );

  useEffect(
    function reportOpenAndClose() {
      if (!isOpen) return undefined;
      cancelled.current = false;
      emitRef.current(layerEvent("open", latest.current));
      return function reportClose() {
        emitRef.current(layerEvent("close", latest.current));
      };
    },
    [isOpen],
  );

  return { cancel };
}

/** An `open` or `close` event of the dialog. */
function layerEvent(type: "open" | "close", options: DialogLayerOptions): UiEvent {
  return { type, component: options.component, name: options.title };
}
