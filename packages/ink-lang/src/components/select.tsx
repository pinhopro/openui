import { Box, Text, useInput, type DOMElement } from "ink";
import { useRef, useState, type ReactNode } from "react";
import type { z } from "zod/v4";
import { useIsStreaming } from "../context";
import { useFocusable } from "../focus/use-focusable";
import { defineComponent, type ComponentRenderProps } from "../library";
import { useMouse } from "../mouse/use-mouse";
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

interface OptionRowProps {
  option: SelectOption;
  index: number;
  isSelected: boolean;
  isUnderCursor: boolean;
  onPick: (index: number) => void;
}

/** One option line: a filled mark for the stored value, inverse video under the cursor; a click picks it. */
function OptionRow({ option, index, isSelected, isUnderCursor, onPick }: OptionRowProps) {
  const rowRef = useRef<DOMElement | null>(null);
  useMouse(rowRef, {
    onClick: function handleClick() {
      onPick(index);
    },
  });
  return (
    <Box ref={rowRef}>
      <Text>
        {"  " + (isSelected ? SELECTED_MARK : UNSELECTED_MARK) + " "}
        <Text inverse={isUnderCursor}>{" " + option.label + " "}</Text>
      </Text>
    </Box>
  );
}

interface OptionListProps {
  options: SelectOption[];
  selectedIndex: number;
  cursor: number;
  onPick: (index: number) => void;
}

function OptionList({ options, selectedIndex, cursor, onPick }: OptionListProps) {
  const rows: ReactNode[] = [];
  for (let index = 0; index < options.length; index += 1) {
    rows.push(
      <OptionRow
        key={index}
        option={options[index] as SelectOption}
        index={index}
        isSelected={index === selectedIndex}
        isUnderCursor={index === cursor}
        onPick={onPick}
      />,
    );
  }
  return <Box flexDirection="column">{rows}</Box>;
}

/**
 * The model-facing `Select`: a focusable list bound to the store. Unfocused it
 * shows the picked label (or the placeholder); focused it opens the list, Up
 * and Down move the cursor and Enter or Space store the option's value. With
 * the mouse, a click opens it, a click on an option picks it and the wheel
 * moves the cursor.
 */
function SelectRenderer({ props }: ComponentRenderProps<SelectProps>) {
  const isStreaming = useIsStreaming();
  const field = useStateField<unknown>(props.name, props.value);
  const options = selectOptions(props.items);
  const selectedIndex = indexOfOption(options, field.value);
  // null until the user moves: the cursor then follows the stored value.
  const [movedCursor, setMovedCursor] = useState<number | null>(null);
  const restingCursor = selectedIndex === -1 ? 0 : selectedIndex;
  const cursor = clampIndex(movedCursor === null ? restingCursor : movedCursor, options.length);
  // Several keys can arrive in one stdin chunk before React re-renders.
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;
  // A press on the summary line focuses (and so opens) it; the wheel moves the cursor.
  const focusable = useFocusable({
    isActive: !isStreaming,
    name: field.name,
    arrows: { vertical: true },
    mouse: {
      onWheel: function handleWheel(event) {
        if (isStreaming) return;
        focusable.focus();
        moveCursor(
          event.direction === "up" || event.direction === "left" ? -event.ticks : event.ticks,
        );
      },
    },
  });
  const canUse = focusable.isFocused && !isStreaming;

  function moveCursor(delta: number): void {
    const next = stepIndex(cursorRef.current, options.length, delta);
    cursorRef.current = next;
    setMovedCursor(next);
  }

  function pick(index: number): void {
    const picked = options[index];
    if (picked === undefined) return;
    cursorRef.current = index;
    setMovedCursor(index);
    field.setValue(picked.value);
  }

  useInput(
    function handleSelectKey(input, key) {
      const delta = verticalStep(key);
      if (delta !== 0) {
        moveCursor(delta);
        return;
      }
      if (isPressKey(input, key)) pick(cursorRef.current);
    },
    { isActive: canUse },
  );

  function pickWithMouse(index: number): void {
    if (!isStreaming) pick(index);
  }

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
    <Box ref={focusable.ref} flexDirection="column">
      <Text>
        {prefix + "▾ "}
        {summary}
      </Text>
      {focusable.isFocused ? (
        <OptionList
          options={options}
          selectedIndex={selectedIndex}
          cursor={cursor}
          onPick={pickWithMouse}
        />
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
