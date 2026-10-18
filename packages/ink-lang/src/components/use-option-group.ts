import { useInput } from "ink";
import { useRef, useState } from "react";
import { useIsStreaming } from "../context";
import { useFocusable } from "../focus/use-focusable";
import { horizontalStep, verticalStep } from "./arrow-keys";
import { isPressKey } from "./button-keys";
import { clampIndex, stepIndex } from "./step-index";

export interface OptionGroupOptions {
  /** How many options the group has. */
  count: number;
  /** Called with the index under the cursor when Enter or Space is pressed. */
  onPress: (index: number) => void;
}

export interface OptionGroup {
  isFocused: boolean;
  /** The option the arrow keys point at; only meaningful while focused. */
  cursor: number;
}

/**
 * One focus stop for a whole group of options: Up / Down (or Left / Right)
 * move the cursor without wrapping, Enter or Space press the option under it.
 */
export function useOptionGroup({ count, onPress }: OptionGroupOptions): OptionGroup {
  const isStreaming = useIsStreaming();
  const focusable = useFocusable({ isActive: !isStreaming });
  const [storedCursor, setStoredCursor] = useState(0);
  const cursor = clampIndex(storedCursor, count);
  // Several keys can arrive in one stdin chunk before React re-renders.
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;

  useInput(
    function handleGroupKey(input, key) {
      let delta = verticalStep(key);
      if (delta === 0) delta = horizontalStep(key);
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

  return { isFocused: focusable.isFocused, cursor };
}
