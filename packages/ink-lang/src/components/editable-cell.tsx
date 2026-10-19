import { Box, Text, useInput } from "ink";
import { useRef, useState } from "react";
import { useIsStreaming } from "../context";
import { useFocusable } from "../focus/use-focusable";
import { useTheme } from "../theme";
import { textProps } from "../theme-styles";
import { useInputEvent } from "../use-input-event";
import { verticalStep } from "./arrow-keys";
import { isPressKey } from "./button-keys";
import {
  cellLabel,
  nextOptionValue,
  parseCellInput,
  type EditableColumn,
} from "./editable-table-layout";
import { padEnd, padStart } from "./pad";
import { applyKeyToEditor, countGraphemes, splitForCursor, type EditorState } from "./text-editing";

export interface EditableCellProps {
  /** The table's field name, for UI events. */
  name: string;
  column: EditableColumn;
  value: unknown;
  width: number;
  /** The cell's stop order in the table: row by row, then column by column. */
  order: number;
  onChange: (value: unknown) => void;
}

/** A select cell: Up and Down (or Enter and Space) move to the previous or next option. */
function SelectCell({ name, column, value, width, order, onChange }: EditableCellProps) {
  const isStreaming = useIsStreaming();
  const theme = useTheme();
  const focusable = useFocusable({
    isActive: !isStreaming,
    name,
    order,
    // Up and Down move through the options while there is one in that direction.
    arrows: function claims(direction) {
      if (direction === "up") return nextOptionValue(column, value, -1) !== undefined;
      if (direction === "down") return nextOptionValue(column, value, 1) !== undefined;
      return false;
    },
  });

  useInput(
    function handleSelectCellKey(input, key) {
      let delta = verticalStep(key);
      if (delta === 0 && isPressKey(input, key)) delta = 1;
      if (delta === 0) return;
      const next = nextOptionValue(column, value, delta);
      if (next !== undefined) onChange(next);
    },
    { isActive: focusable.isFocused && !isStreaming },
  );

  const label = cellLabel(column, value);
  return (
    <Box ref={focusable.ref}>
      <Text>
        <Text {...(focusable.isFocused ? textProps(theme.focusRing) : {})}>{label}</Text>
        {padEnd("", width - countGraphemes(label))}
      </Text>
    </Box>
  );
}

/** A text cell: the single-line editor of Input, padded to the column width. */
function TextCell({ name, column, value, width, order, onChange }: EditableCellProps) {
  const isStreaming = useIsStreaming();
  const text = cellLabel(column, value);
  const [editor, setEditor] = useState<EditorState>({ value: text, cursor: countGraphemes(text) });
  const current: EditorState =
    editor.value === text ? editor : { value: text, cursor: countGraphemes(text) };
  const editorRef = useRef<EditorState>(current);
  editorRef.current = current;
  const focusable = useFocusable({
    isActive: !isStreaming,
    name,
    order,
    // Left and Right move the cursor while it can move; at the ends they move focus.
    arrows: function claims(direction) {
      if (direction === "left") return editorRef.current.cursor > 0;
      if (direction === "right") {
        return editorRef.current.cursor < countGraphemes(editorRef.current.value);
      }
      return false;
    },
  });
  const reportInput = useInputEvent(name);

  useInput(
    function handleTextCellKey(input, key) {
      const previous = editorRef.current;
      const next = applyKeyToEditor(previous, input, key);
      editorRef.current = next;
      setEditor(next);
      if (next.value !== previous.value) {
        reportInput(next.value);
        onChange(parseCellInput(column, next.value));
      }
    },
    { isActive: focusable.isFocused && !isStreaming },
  );

  if (!focusable.isFocused) {
    const aligned = column.type === "number" ? padStart(text, width) : padEnd(text, width);
    return (
      <Box ref={focusable.ref}>
        <Text>{aligned}</Text>
      </Box>
    );
  }
  const split = splitForCursor(text, current.cursor);
  const shownWidth = countGraphemes(split.before) + 1 + countGraphemes(split.after);
  return (
    <Box ref={focusable.ref}>
      <Text>
        {split.before}
        <Text inverse>{split.at}</Text>
        {split.after}
        {padEnd("", width - shownWidth)}
      </Text>
    </Box>
  );
}

/** One focusable cell of an EditableTable. */
export function EditableCell(props: EditableCellProps) {
  if (props.column.type === "select") return <SelectCell {...props} />;
  return <TextCell {...props} />;
}
