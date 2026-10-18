import { useFocus, useFocusManager } from "ink";
import { useCallback, useId } from "react";

export interface FocusableOptions {
  /** False takes the component out of the Tab cycle (for example while streaming). */
  isActive: boolean;
}

export interface Focusable {
  isFocused: boolean;
  /** Moves Ink's focus to this component (a no-op while it is inactive). */
  focus: () => void;
}

/**
 * Registers the component with Ink's focus manager under an id that is unique
 * per mounted instance, so Tab and Shift+Tab move between buttons and inputs
 * even when the same statement is rendered more than once.
 */
export function useFocusable(options: FocusableOptions): Focusable {
  const id = useId();
  const focus = useFocus({ id, isActive: options.isActive });
  const manager = useFocusManager();
  const focusSelf = useCallback(
    function focusSelf() {
      manager.focus(id);
    },
    [id, manager],
  );
  return { isFocused: focus.isFocused, focus: focusSelf };
}
