import { Box, Text, useInput, type DOMElement } from "ink";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { z } from "zod/v4";
import { useIsStreaming } from "../context";
import { useFocusable } from "../focus/use-focusable";
import { defineComponent, type ComponentRenderProps } from "../library";
import { useMouse } from "../mouse/use-mouse";
import { ComboboxSchema } from "../schemas/combobox-schema";
import { useTheme } from "../theme";
import { textProps } from "../theme-styles";
import { useFieldStyles } from "../use-field-styles";
import { useFieldValidation } from "../use-field-validation";
import { useStateField } from "../use-state-field";
import { verticalStep } from "./arrow-keys";
import { filterOptions, listWindow } from "./combobox-options";
import { FieldFrame } from "./field-frame";
import { indexOfOption, selectOptions, type SelectOption } from "./select-options";
import { clampIndex, stepIndex } from "./step-index";
import { applyKeyToEditor, splitForCursor, type EditorState } from "./text-editing";

type ComboboxProps = z.infer<typeof ComboboxSchema>;

const DEFAULT_PLACEHOLDER = "Search...";
const LIST_ROWS = 5;
const SELECTED_MARK = "●";
const UNSELECTED_MARK = "○";
const EMPTY_EDITOR: EditorState = { value: "", cursor: 0 };

interface MatchRowProps {
  option: SelectOption;
  index: number;
  isSelected: boolean;
  isUnderCursor: boolean;
  onPick: (index: number) => void;
}

/** One visible match: a mark for the stored value, inverse video under the cursor; a click picks it. */
function MatchRow({ option, index, isSelected, isUnderCursor, onPick }: MatchRowProps) {
  const theme = useTheme();
  const rowRef = useRef<DOMElement | null>(null);
  const cursorStyle = isUnderCursor ? textProps(theme.focusRing) : textProps({});
  useMouse(rowRef, {
    onClick: function handleClick() {
      onPick(index);
    },
  });
  return (
    <Box ref={rowRef}>
      <Text>
        {"  " + (isSelected ? SELECTED_MARK : UNSELECTED_MARK) + " "}
        <Text {...cursorStyle}>{" " + option.label + " "}</Text>
      </Text>
    </Box>
  );
}

interface FilteredListProps {
  options: SelectOption[];
  selectedValue: unknown;
  cursor: number;
  onPick: (index: number) => void;
}

/** The visible slice of the matches, one `MatchRow` each. */
function FilteredList({ options, selectedValue, cursor, onPick }: FilteredListProps) {
  if (options.length === 0) {
    return <Text dimColor>{"    no matches"}</Text>;
  }
  const window = listWindow(options.length, cursor, LIST_ROWS);
  const lines: ReactNode[] = [];
  for (let index = window.start; index < window.end; index += 1) {
    const option = options[index] as SelectOption;
    lines.push(
      <MatchRow
        key={option.value + ":" + String(index)}
        option={option}
        index={index}
        isSelected={option.value === selectedValue}
        isUnderCursor={index === cursor}
        onPick={onPick}
      />,
    );
  }
  if (window.hiddenAfter > 0) {
    lines.push(
      <Text key="more" dimColor>
        {"    +" + String(window.hiddenAfter) + " more"}
      </Text>,
    );
  }
  return <Box flexDirection="column">{lines}</Box>;
}

interface FilterLineProps {
  editor: EditorState;
  fallback: ReactNode;
}

/** The focused first line: the typed filter with a block cursor, or the fallback while empty. */
function FilterLine({ editor, fallback }: FilterLineProps) {
  if (editor.value === "") {
    return (
      <Text>
        {"> "}
        <Text inverse> </Text>
        {fallback}
      </Text>
    );
  }
  const split = splitForCursor(editor.value, editor.cursor);
  return (
    <Text>
      {"> " + split.before}
      <Text inverse>{split.at}</Text>
      {split.after}
    </Text>
  );
}

/**
 * The model-facing `Combobox`: a Select with a filter line. Unfocused it shows
 * the picked label (or the placeholder); focused, typing narrows the option
 * list, Up and Down move the highlight, Enter stores the highlighted option's
 * value and Escape clears the filter. With the mouse, a click opens it, a
 * click on a match picks it and the wheel moves the highlight.
 */
function ComboboxRenderer({ props }: ComponentRenderProps<ComboboxProps>) {
  const isStreaming = useIsStreaming();
  const field = useStateField<unknown>(props.name, props.value);
  // A press focuses (and so opens) it; the wheel moves the highlight.
  const focusable = useFocusable({
    isActive: !isStreaming,
    name: field.name,
    arrows: { horizontal: true, vertical: true },
    mouse: {
      onWheel: function handleWheel(event) {
        if (isStreaming) return;
        focusable.focus();
        moveHighlight(
          event.direction === "up" || event.direction === "left" ? -event.ticks : event.ticks,
        );
      },
    },
  });
  const valueRef = useRef<unknown>(field.value);
  valueRef.current = field.value;
  const validation = useFieldValidation({
    fieldName: field.name,
    rules: props.rules,
    isFocused: focusable.isFocused,
    getValue: function readValue() {
      return valueRef.current;
    },
  });
  const options = selectOptions(props.items);
  const [editor, setEditor] = useState<EditorState>(EMPTY_EDITOR);
  const [highlight, setHighlight] = useState(0);
  const filtered = filterOptions(options, editor.value);
  const cursor = clampIndex(highlight, filtered.length);
  // Several keys can arrive in one stdin chunk before React re-renders.
  const editorRef = useRef<EditorState>(editor);
  editorRef.current = editor;
  const highlightRef = useRef(cursor);
  highlightRef.current = cursor;
  const canUse = focusable.isFocused && !isStreaming;
  const styles = useFieldStyles(focusable.isFocused);

  function resetFilter(): void {
    editorRef.current = EMPTY_EDITOR;
    highlightRef.current = 0;
    setEditor(EMPTY_EDITOR);
    setHighlight(0);
  }

  // Leaving the field drops a half-typed filter.
  const isFocused = focusable.isFocused;
  useEffect(
    function clearFilterOnBlur() {
      if (!isFocused) resetFilter();
    },
    [isFocused],
  );

  function moveHighlight(delta: number): void {
    const matches = filterOptions(options, editorRef.current.value);
    const next = stepIndex(highlightRef.current, matches.length, delta);
    highlightRef.current = next;
    setHighlight(next);
  }

  /** Stores the match at `index` of the current filter and clears the filter. */
  function pick(index: number): void {
    const matches = filterOptions(options, editorRef.current.value);
    const picked = matches[clampIndex(index, matches.length)];
    if (picked === undefined) return;
    field.setValue(picked.value);
    validation.clearError();
    resetFilter();
  }

  useInput(
    function handleComboboxKey(input, key) {
      if (key.eventType === "release") return;
      const delta = verticalStep(key);
      if (delta !== 0) {
        moveHighlight(delta);
        return;
      }
      if (key.escape) {
        resetFilter();
        return;
      }
      if (key.return) {
        pick(highlightRef.current);
        return;
      }
      const previous = editorRef.current;
      const next = applyKeyToEditor(previous, input, key);
      editorRef.current = next;
      setEditor(next);
      if (next.value !== previous.value) {
        highlightRef.current = 0;
        setHighlight(0);
      }
    },
    { isActive: canUse },
  );

  function pickWithMouse(index: number): void {
    if (!isStreaming) pick(index);
  }

  const selectedIndex = indexOfOption(options, field.value);
  const selected = options[selectedIndex];
  const placeholder = props.placeholder ?? DEFAULT_PLACEHOLDER;
  let summary: ReactNode;
  const bold = focusable.isFocused ? true : styles.text.bold;
  if (selected !== undefined) {
    summary = (
      <Text {...styles.text} bold={bold}>
        {selected.label}
      </Text>
    );
  } else if (typeof field.value === "string" && field.value !== "") {
    summary = (
      <Text {...styles.text} bold={bold}>
        {field.value}
      </Text>
    );
  } else {
    summary = <Text {...styles.placeholder}>{placeholder}</Text>;
  }

  if (!focusable.isFocused) {
    return (
      <FieldFrame boxRef={focusable.ref} isFocused={false}>
        <Text {...styles.text}>
          {"  ▾ "}
          {summary}
        </Text>
      </FieldFrame>
    );
  }

  return (
    <FieldFrame boxRef={focusable.ref} isFocused column>
      <FilterLine editor={editor} fallback={summary} />
      <FilteredList
        options={filtered}
        selectedValue={field.value}
        cursor={cursor}
        onPick={pickWithMouse}
      />
    </FieldFrame>
  );
}

export const Combobox = defineComponent({
  name: "Combobox",
  props: ComboboxSchema,
  description:
    "Searchable select: typing filters the SelectItem options, Enter picks the highlighted one",
  component: ComboboxRenderer,
});
