import { useFocusManager, useInput, type Key } from "ink";
import { useContext } from "react";
import { useIsStreaming } from "../context";
import { FocusRegistryContext, type FocusRegistry } from "../focus/focus-registry";
import { useOverlayId } from "../overlay/overlay-content-context";

export interface DialogKeysProps {
  /** Moves the dialog by whole cells (`useDrag`'s `moveBy`). */
  onMove: (dx: number, dy: number) => void;
}

/** True when the focused stop `id` is an active stop of the overlay `overlay`. */
function hasFocusIn(
  registry: FocusRegistry | null,
  id: string | undefined,
  overlay: string | null,
): boolean {
  if (registry === null || id === undefined || overlay === null) return false;
  const entry = registry.find(id);
  return entry !== null && entry.isActive && entry.overlay === overlay;
}

/** Ctrl and nothing else held. */
function isCtrlOnly(key: Key): boolean {
  return key.ctrl && !key.shift && !key.meta && !key.super && !key.hyper;
}

/**
 * Put inside a dialog's overlay content: Ctrl+Left, Right, Up and Down move
 * the dialog one cell while one of its own stops has focus (so a page dialog
 * stays put while focus is in a modal on top, or on the page), and not
 * while the program streams. The focus navigator and the components' own
 * arrow steps (`horizontalStep`, `verticalStep`) ignore modified arrows, so
 * focus and the focused value stay as they are. Re-rendered
 * on every focus change (the focus manager's context). Draws nothing.
 */
export function DialogKeys({ onMove }: DialogKeysProps): null {
  const registry = useContext(FocusRegistryContext);
  const overlay = useOverlayId();
  const activeId = useFocusManager().activeId;
  const isStreaming = useIsStreaming();

  useInput(
    function handleMoveKey(_input, key) {
      if (key.eventType === "release" || !isCtrlOnly(key)) return;
      if (key.leftArrow) onMove(-1, 0);
      else if (key.rightArrow) onMove(1, 0);
      else if (key.upArrow) onMove(0, -1);
      else if (key.downArrow) onMove(0, 1);
    },
    { isActive: !isStreaming && hasFocusIn(registry, activeId, overlay) },
  );
  return null;
}
