import type { DOMElement } from "ink";
import { useInput } from "ink";
import { useRef, useState, type RefObject } from "react";
import { useIsStreaming } from "../context";
import { useFocusable } from "../focus/use-focusable";
import { horizontalStep, verticalStep } from "./arrow-keys";
import { isPressKey } from "./button-keys";
import { clampIndex, stepIndex } from "./step-index";

export type OptionGroupOrientation = "vertical" | "horizontal";

export interface OptionGroupOptions {
  /** How many options the group has. */
  count: number;
  /** Called with the index under the cursor when Enter or Space is pressed, or an option is clicked. */
  onPress: (index: number) => void;
  /** Which arrows move the cursor; the arrows of the other axis move focus away. */
  orientation: OptionGroupOrientation;
  /** The field name, for UI events. */
  name: string;
}

export interface OptionGroup {
  /** Put this on the group's outer `Box`. */
  ref: RefObject<DOMElement | null>;
  isFocused: boolean;
  /** The option the arrow keys point at; only meaningful while focused. */
  cursor: number;
  /** Presses the option at `index` and moves the cursor there (what a click does). */
  pressAt: (index: number) => void;
}

/**
 * One focus stop for a whole group of options: the arrows of its orientation
 * move the cursor without wrapping, Enter or Space press the option under it,
 * and a click presses the option under the pointer.
 */
export function useOptionGroup({
  count,
  onPress,
  orientation,
  name,
}: OptionGroupOptions): OptionGroup {
  const isStreaming = useIsStreaming();
  const isVertical = orientation === "vertical";
  const focusable = useFocusable({
    isActive: !isStreaming,
    name,
    arrows: { horizontal: !isVertical, vertical: isVertical },
  });
  const [storedCursor, setStoredCursor] = useState(0);
  const cursor = clampIndex(storedCursor, count);
  // Several keys can arrive in one stdin chunk before React re-renders.
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;

  useInput(
    function handleGroupKey(input, key) {
      const delta = isVertical ? verticalStep(key) : horizontalStep(key);
      if (delta !== 0) {
        const next = stepIndex(cursorRef.current, count, delta);
        cursorRef.current = next;
        setStoredCursor(next);
        return;
      }
      if (isPressKey(input, key)) onPress(cursorRef.current);
    },
    { isActive: focusable.isFocused && !isStreaming },
  );

  function pressAt(index: number): void {
    if (isStreaming) return;
    const target = clampIndex(index, count);
    cursorRef.current = target;
    setStoredCursor(target);
    onPress(target);
  }

  return { ref: focusable.ref, isFocused: focusable.isFocused, cursor, pressAt };
}
