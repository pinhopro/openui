import { useEffect } from "react";
import { useIsStreaming } from "../context";
import { useFocusCommands } from "../focus/focus-commands";
import { useLayerIsActive } from "../focus/modal-layer";
import { useOverlayVisible } from "../overlay/overlay-content-context";

/**
 * Put inside a dialog's overlay content: moves focus to the first stop of the
 * cycle once the content shows (its stops are inert while the overlay's form
 * is only measured), the program is not streaming and the dialog's layer is
 * the active one, which for a modal leaves only its own stops in the cycle.
 * It runs again whenever one of those turns true: when streaming ends, or an
 * inner modal closes and this one is on top again. Draws nothing.
 */
export function DialogFocusOnShow(): null {
  const visible = useOverlayVisible();
  const isStreaming = useIsStreaming();
  const layerActive = useLayerIsActive();
  const focusFirst = useFocusCommands().focusFirst;
  const ready = visible && !isStreaming && layerActive;
  // On a timer: the dialog's stops become active in this same commit, and Ink
  // only focuses an id it already knows as active.
  useEffect(
    function focusIntoDialog() {
      if (!ready) return undefined;
      const timer = setTimeout(focusFirst, 0);
      return function cancelFocus() {
        clearTimeout(timer);
      };
    },
    [focusFirst, ready],
  );
  return null;
}
