import { Box, Text, useInput } from "ink";
import { useRef, useState, type ReactNode } from "react";
import type { z } from "zod/v4";
import { useIsStreaming } from "../context";
import { useFocusable } from "../focus/use-focusable";
import { defineComponent, type ComponentRenderProps } from "../library";
import { SelectSchema } from "../schemas/select-schema";
import { useStateField } from "../use-state-field";
import { verticalStep } from "./arrow-keys";
import { isPressKey } from "./button-keys";
import { indexOfOption, selectOptions, type SelectOption } from "./select-options";
import { clampIndex, stepIndex } from "./step-index";

type SelectProps = z.infer<typeof SelectSchema>;

const DEFAULT_PLACEHOLDER = "Select...";
const SELECTED_MARK = "●";
const UNSELECTED_MARK = "○";

interface OptionListProps {
  options: SelectOption[];
  selectedIndex: number;
  cursor: number;
}

/** One line per option: a filled mark for the stored value, inverse video under the cursor. */
function OptionList({ options, selectedIndex, cursor }: OptionListProps) {
  const lines: ReactNode[] = [];
  for (let index = 0; index < options.length; index += 1) {
    const option = options[index] as SelectOption;
    const mark = index === selectedIndex ? SELECTED_MARK : UNSELECTED_MARK;
    lines.push(
      <Text key={index}>
        {"  " + mark + " "}
        <Text inverse={index === cursor}>{" " + option.label + " "}</Text>
      </Text>,
    );
  }
  return <Box flexDirection="column">{lines}</Box>;
}

/**
 * The model-facing `Select`: a focusable list bound to the store. Unfocused it
 * shows the picked label (or the placeholder); focused it opens the list, Up
 * and Down move the cursor and Enter or Space store the option's value.
 */
function SelectRenderer({ props }: ComponentRenderProps<SelectProps>) {
  const isStreaming = useIsStreaming();
  const field = useStateField<unknown>(props.name, props.value);
  const focusable = useFocusable({ isActive: !isStreaming });
  const options = selectOptions(props.items);
  const selectedIndex = indexOfOption(options, field.value);
  // null until the user moves: the cursor then follows the stored value.
  const [movedCursor, setMovedCursor] = useState<number | null>(null);
  const restingCursor = selectedIndex === -1 ? 0 : selectedIndex;
  const cursor = clampIndex(movedCursor === null ? restingCursor : movedCursor, options.length);
  // Several keys can arrive in one stdin chunk before React re-renders.
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;
  const canUse = focusable.isFocused && !isStreaming;

  useInput(
    function handleSelectKey(input, key) {
      const delta = verticalStep(key);
      if (delta !== 0) {
        const next = stepIndex(cursorRef.current, options.length, delta);
        cursorRef.current = next;
        setMovedCursor(next);
        return;
      }
      if (!isPressKey(input, key)) return;
      const picked = options[cursorRef.current];
      if (picked !== undefined) field.setValue(picked.value);
    },
    { isActive: canUse },
  );

  const selected = options[selectedIndex];
  const placeholder = props.placeholder ?? DEFAULT_PLACEHOLDER;
  const prefix = focusable.isFocused ? "> " : "  ";
  const summary =
    selected === undefined ? (
      <Text dimColor>{placeholder}</Text>
    ) : (
      <Text bold={focusable.isFocused}>{selected.label}</Text>
    );

  return (
    <Box flexDirection="column">
      <Text>
        {prefix + "▾ "}
        {summary}
      </Text>
      {focusable.isFocused ? (
        <OptionList options={options} selectedIndex={selectedIndex} cursor={cursor} />
      ) : null}
    </Box>
  );
}

export const Select = defineComponent({
  name: "Select",
  props: SelectSchema,
  description: "",
  component: SelectRenderer,
});
