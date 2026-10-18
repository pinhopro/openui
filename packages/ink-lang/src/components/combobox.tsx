import { Box, Text, useInput } from "ink";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { z } from "zod/v4";
import { useIsStreaming } from "../context";
import { useFocusable } from "../focus/use-focusable";
import { defineComponent, type ComponentRenderProps } from "../library";
import { ComboboxSchema } from "../schemas/combobox-schema";
import { useFieldRules } from "../use-field-rules";
import { useStateField } from "../use-state-field";
import { verticalStep } from "./arrow-keys";
import { filterOptions, listWindow } from "./combobox-options";
import { indexOfOption, selectOptions, type SelectOption } from "./select-options";
import { clampIndex, stepIndex } from "./step-index";
import { applyKeyToEditor, splitForCursor, type EditorState } from "./text-editing";

type ComboboxProps = z.infer<typeof ComboboxSchema>;

const DEFAULT_PLACEHOLDER = "Search...";
const LIST_ROWS = 5;
const SELECTED_MARK = "●";
const UNSELECTED_MARK = "○";
const EMPTY_EDITOR: EditorState = { value: "", cursor: 0 };

interface FilteredListProps {
  options: SelectOption[];
  selectedValue: unknown;
  cursor: number;
}

/** The visible slice of the matches: a mark for the stored value, inverse video under the cursor. */
function FilteredList({ options, selectedValue, cursor }: FilteredListProps) {
  if (options.length === 0) {
    return <Text dimColor>{"    no matches"}</Text>;
  }
  const window = listWindow(options.length, cursor, LIST_ROWS);
  const lines: ReactNode[] = [];
  for (let index = window.start; index < window.end; index += 1) {
    const option = options[index] as SelectOption;
    const mark = option.value === selectedValue ? SELECTED_MARK : UNSELECTED_MARK;
    lines.push(
      <Text key={option.value + ":" + String(index)}>
        {"  " + mark + " "}
        <Text inverse={index === cursor}>{" " + option.label + " "}</Text>
      </Text>,
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
 * value and Escape clears the filter.
 */
function ComboboxRenderer({ props }: ComponentRenderProps<ComboboxProps>) {
  const isStreaming = useIsStreaming();
  const field = useStateField<unknown>(props.name, props.value);
  const focusable = useFocusable({ isActive: !isStreaming });
  const valueRef = useRef<unknown>(field.value);
  valueRef.current = field.value;
  const fieldRules = useFieldRules(
    field.name,
    props.rules,
    valueRef,
    focusable.isFocused,
    isStreaming,
  );
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

  useInput(
    function handleComboboxKey(input, key) {
      if (key.eventType === "release") return;
      const matches = filterOptions(options, editorRef.current.value);
      const delta = verticalStep(key);
      if (delta !== 0) {
        const next = stepIndex(highlightRef.current, matches.length, delta);
        highlightRef.current = next;
        setHighlight(next);
        return;
      }
      if (key.escape) {
        resetFilter();
        return;
      }
      if (key.return) {
        const picked = matches[clampIndex(highlightRef.current, matches.length)];
        if (picked === undefined) return;
        field.setValue(picked.value);
        fieldRules.clearError();
        resetFilter();
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

  const selectedIndex = indexOfOption(options, field.value);
  const selected = options[selectedIndex];
  const placeholder = props.placeholder ?? DEFAULT_PLACEHOLDER;
  let summary: ReactNode;
  if (selected !== undefined) {
    summary = <Text bold={focusable.isFocused}>{selected.label}</Text>;
  } else if (typeof field.value === "string" && field.value !== "") {
    summary = <Text bold={focusable.isFocused}>{field.value}</Text>;
  } else {
    summary = <Text dimColor>{placeholder}</Text>;
  }

  if (!focusable.isFocused) {
    return (
      <Text>
        {"  ▾ "}
        {summary}
      </Text>
    );
  }

  return (
    <Box flexDirection="column">
      <FilterLine editor={editor} fallback={summary} />
      <FilteredList options={filtered} selectedValue={field.value} cursor={cursor} />
    </Box>
  );
}

export const Combobox = defineComponent({
  name: "Combobox",
  props: ComboboxSchema,
  description:
    "Searchable select: typing filters the SelectItem options, Enter picks the highlighted one",
  component: ComboboxRenderer,
});
