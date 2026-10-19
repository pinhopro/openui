import { useFocusManager } from "ink";
import { useContext, useEffect, useRef } from "react";
import { useIsStreaming } from "../context";
import { useFocusCommands, type FocusCommands } from "../focus/focus-commands";
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
 * True when `id` is a stop outside the overlay `overlay` that can take focus
 * right now: focus was moved out of the dialog on purpose (Tab, a click on
 * the page). A stop that is gone or inert (an inner modal's, just closed) is
 * not one.
 */
function isActiveStopOutside(
  registry: FocusRegistry | null,
  id: string | undefined,
  overlay: string | null,
): boolean {
  if (registry === null || id === undefined) return false;
  const entry = registry.find(id);
  return entry !== null && entry.isActive && entry.overlay !== overlay;
}

/** The focused id and the dialog's readiness as the last focus check saw them. */
interface SeenFocus {
  activeId: string | undefined;
  ready: boolean;
}

/**
 * True when focus was dropped on purpose (Escape): a stop had it and now
 * none has, while the dialog stayed ready. A stop losing focus because the
 * dialog paused (a hidden re-measure turns its stops inert) is not: the
 * dialog was not ready when the stop had it last.
 */
function wasDropped(before: SeenFocus, activeId: string | undefined): boolean {
  return activeId === undefined && before.ready && before.activeId !== undefined;
}

/** Focuses the first stop of the overlay `overlay`, or of the whole cycle outside any overlay. */
function focusFirstOf(commands: FocusCommands, overlay: string | null): void {
  if (overlay === null) commands.focusFirst();
  else commands.focusFirstIn(overlay);
}

/**
 * Put inside a dialog's overlay content (it mounts once per open): moves
 * focus into the dialog once the content shows (its stops are inert while
 * the overlay's form is only measured), the program is not streaming and the
 * dialog's layer is the active one. It focuses the dialog's first stop (the
 * first stop of the cycle in its overlay: a modal's layer leaves only its own
 * stops in the cycle, a non-modal dialog's sit among the page's) once per
 * open; while the dialog is ready it remembers the stop of its own that has
 * focus, and when the dialog is ready again after a pause (a hidden
 * re-measure on a resize, an inner modal on top, streaming) it focuses that
 * stop again if it can still take focus. Once focus moves to a stop outside
 * the dialog (possible for a non-modal one), or is dropped while the dialog
 * is ready (Escape on a non-modal one), it forgets its stop, so it never
 * pulls focus back. Draws nothing.
 */
export function DialogFocusOnShow(): null {
  const visible = useOverlayVisible();
  const isStreaming = useIsStreaming();
  const layerActive = useLayerIsActive();
  const overlay = useOverlayId();
  const registry = useContext(FocusRegistryContext);
  const manager = useFocusManager();
  const commands = useFocusCommands();
  const ready = visible && !isStreaming && layerActive;
  const focusedFirst = useRef(false);
  const remembered = useRef<string | undefined>(undefined);
  const managerRef = useRef(manager);
  managerRef.current = manager;

  // Re-rendered on every focus change (the focus manager's context): the stop
  // of this dialog that has focus while it is ready, kept across a pause, and
  // forgotten once focus moves out of the dialog or is dropped.
  const activeId = manager.activeId;
  const seen = useRef<SeenFocus>({ activeId, ready });
  useEffect(
    function rememberFocusedStop() {
      const before = seen.current;
      seen.current = { activeId, ready };
      if (!ready) return;
      if (isActiveStopOf(registry, activeId, overlay)) remembered.current = activeId;
      else if (isActiveStopOutside(registry, activeId, overlay)) remembered.current = undefined;
      else if (wasDropped(before, activeId)) remembered.current = undefined;
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
          focusFirstOf(commands, overlay);
        }
        focusedFirst.current = true;
      }, 0);
      return function cancelFocus() {
        clearTimeout(timer);
      };
    },
    [commands, overlay, ready, registry],
  );
  return null;
}
