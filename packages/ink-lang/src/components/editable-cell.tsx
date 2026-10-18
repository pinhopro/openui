import { Text, useInput } from "ink";
import { useRef, useState } from "react";
import { useIsStreaming } from "../context";
import { useFocusable } from "../focus/use-focusable";
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
  column: EditableColumn;
  value: unknown;
  width: number;
  onChange: (value: unknown) => void;
}

/** A select cell: Up and Down (or Enter and Space) move to the previous or next option. */
function SelectCell({ column, value, width, onChange }: EditableCellProps) {
  const isStreaming = useIsStreaming();
  const focusable = useFocusable({ isActive: !isStreaming });

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
    <Text>
      <Text inverse={focusable.isFocused}>{label}</Text>
      {padEnd("", width - countGraphemes(label))}
    </Text>
  );
}

/** A text cell: the single-line editor of Input, padded to the column width. */
function TextCell({ column, value, width, onChange }: EditableCellProps) {
  const isStreaming = useIsStreaming();
  const focusable = useFocusable({ isActive: !isStreaming });
  const text = cellLabel(column, value);
  const [editor, setEditor] = useState<EditorState>({ value: text, cursor: countGraphemes(text) });
  const current: EditorState =
    editor.value === text ? editor : { value: text, cursor: countGraphemes(text) };
  const editorRef = useRef<EditorState>(current);
  editorRef.current = current;

  useInput(
    function handleTextCellKey(input, key) {
      const previous = editorRef.current;
      const next = applyKeyToEditor(previous, input, key);
      editorRef.current = next;
      setEditor(next);
      if (next.value !== previous.value) onChange(parseCellInput(column, next.value));
    },
    { isActive: focusable.isFocused && !isStreaming },
  );

  if (!focusable.isFocused) {
    const aligned = column.type === "number" ? padStart(text, width) : padEnd(text, width);
    return <Text>{aligned}</Text>;
  }
  const split = splitForCursor(text, current.cursor);
  const shownWidth = countGraphemes(split.before) + 1 + countGraphemes(split.after);
  return (
    <Text>
      {split.before}
      <Text inverse>{split.at}</Text>
      {split.after}
      {padEnd("", width - shownWidth)}
    </Text>
  );
}

/** One focusable cell of an EditableTable. */
export function EditableCell(props: EditableCellProps) {
  if (props.column.type === "select") return <SelectCell {...props} />;
  return <TextCell {...props} />;
}
