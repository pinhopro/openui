import { useFocusManager } from "ink";
import { useContext, useEffect, useRef } from "react";
import { useIsStreaming } from "../context";
import { useFocusCommands } from "../focus/focus-commands";
import { FocusRegistryContext, type FocusRegistry } from "../focus/focus-registry";
import { useLayerIsActive } from "../focus/modal-layer";
import { useOverlayId, useOverlayVisible } from "../overlay/overlay-content-context";

/** True when `id` is a stop of the overlay `overlay` that can take focus right now. */
function isActiveStopOf(
  registry: FocusRegistry | null,
  id: string | undefined,
  overlay: string | null,
): boolean {
  if (registry === null || id === undefined) return false;
  const entry = registry.find(id);
  return entry !== null && entry.isActive && entry.overlay === overlay;
}

/**
 * Put inside a dialog's overlay content (it mounts once per open): moves
 * focus into the dialog once the content shows (its stops are inert while
 * the overlay's form is only measured), the program is not streaming and the
 * dialog's layer is the active one, which for a modal leaves only its own
 * stops in the cycle. It focuses the first stop once per open; while the
 * dialog is ready it remembers the stop of its own that has focus, and when
 * the dialog is ready again after a pause (a hidden re-measure on a resize,
 * an inner modal on top, streaming) it focuses that stop again if it can
 * still take focus. Draws nothing.
 */
export function DialogFocusOnShow(): null {
  const visible = useOverlayVisible();
  const isStreaming = useIsStreaming();
  const layerActive = useLayerIsActive();
  const overlay = useOverlayId();
  const registry = useContext(FocusRegistryContext);
  const manager = useFocusManager();
  const focusFirst = useFocusCommands().focusFirst;
  const ready = visible && !isStreaming && layerActive;
  const focusedFirst = useRef(false);
  const remembered = useRef<string | undefined>(undefined);
  const managerRef = useRef(manager);
  managerRef.current = manager;

  // Re-rendered on every focus change (the focus manager's context): the stop
  // of this dialog that has focus while it is ready, kept across a pause.
  const activeId = manager.activeId;
  useEffect(
    function rememberFocusedStop() {
      if (ready && isActiveStopOf(registry, activeId, overlay)) remembered.current = activeId;
    },
    [activeId, overlay, ready, registry],
  );

  // On a timer: the dialog's stops become active in this same commit, and Ink
  // only focuses an id it already knows as active.
  useEffect(
    function focusIntoDialog() {
      if (!ready) return undefined;
      const timer = setTimeout(function focusDialogStop() {
        const id = remembered.current;
        if (id !== undefined && isActiveStopOf(registry, id, overlay)) {
          if (managerRef.current.activeId !== id) managerRef.current.focus(id);
        } else if (!focusedFirst.current) {
          focusFirst();
        }
        focusedFirst.current = true;
      }, 0);
      return function cancelFocus() {
        clearTimeout(timer);
      };
    },
    [focusFirst, overlay, ready, registry],
  );
  return null;
}
