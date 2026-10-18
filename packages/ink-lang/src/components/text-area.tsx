import { Box, Text, useInput } from "ink";
import { useRef, useState, type ReactNode } from "react";
import type { z } from "zod/v4";
import { useIsStreaming } from "../context";
import { useFocusable } from "../focus/use-focusable";
import { defineComponent, type ComponentRenderProps } from "../library";
import { TextAreaSchema } from "../schemas/text-area-schema";
import { useFieldStyles, type FieldInkStyles } from "../use-field-styles";
import { useFieldValidation } from "../use-field-validation";
import { useInputEvent } from "../use-input-event";
import { useStateField } from "../use-state-field";
import { FieldFrame } from "./field-frame";
import { applyKeyToMultilineEditor, linePosition } from "./multiline-editing";
import { displayText } from "./pad";
import { countGraphemes, splitForCursor, type EditorState } from "./text-editing";

type TextAreaProps = z.infer<typeof TextAreaSchema>;

const DEFAULT_ROWS = 3;

interface TextAreaLinesProps {
  value: string;
  cursor: number;
  rows: number;
  isFocused: boolean;
  placeholder: string;
  styles: FieldInkStyles;
}

/** The text split into lines, padded to `rows`, with the cursor on its line while focused. */
function TextAreaLines({
  value,
  cursor,
  rows,
  isFocused,
  placeholder,
  styles,
}: TextAreaLinesProps) {
  const lines = value.split("\n");
  const position = linePosition(value, cursor);
  const count = Math.max(rows, lines.length);
  const rendered: ReactNode[] = [];
  for (let index = 0; index < count; index += 1) {
    const prefix = index === 0 && isFocused ? "> " : "  ";
    const line = lines[index] ?? "";
    if (isFocused && index === position.line) {
      const split = splitForCursor(line, position.column);
      rendered.push(
        <Text key={index} {...styles.text}>
          {prefix + split.before}
          <Text inverse>{split.at}</Text>
          {split.after}
          {value === "" ? <Text {...styles.placeholder}>{placeholder}</Text> : null}
        </Text>,
      );
      continue;
    }
    if (index === 0 && value === "") {
      rendered.push(
        <Text key={index} {...styles.text}>
          {prefix}
          <Text {...styles.placeholder}>{placeholder}</Text>
        </Text>,
      );
      continue;
    }
    rendered.push(
      <Text key={index} {...styles.text}>
        {prefix + (line === "" ? " " : line)}
      </Text>,
    );
  }
  return <Box flexDirection="column">{rendered}</Box>;
}

/** The model-facing `TextArea`: a focusable multi-line editor bound to the store. */
function TextAreaRenderer({ props }: ComponentRenderProps<TextAreaProps>) {
  const isStreaming = useIsStreaming();
  const field = useStateField<unknown>(props.name, props.value);
  const focusable = useFocusable({
    isActive: !isStreaming,
    name: field.name,
    // The arrows move the cursor while it can move; at the ends of the text
    // or on the first and last line they move focus instead.
    arrows: function claims(direction) {
      const state = editorRef.current;
      if (direction === "left") return state.cursor > 0;
      if (direction === "right") return state.cursor < countGraphemes(state.value);
      const position = linePosition(state.value, state.cursor);
      const lineCount = state.value.split("\n").length;
      if (direction === "up") return position.line > 0;
      return position.line < lineCount - 1;
    },
  });
  const reportInput = useInputEvent(field.name);
  const styles = useFieldStyles(focusable.isFocused);
  const value = displayText(field.value);
  const valueRef = useRef(value);
  valueRef.current = value;
  const validation = useFieldValidation({
    fieldName: field.name,
    rules: props.rules,
    isFocused: focusable.isFocused,
    getValue: function readValue() {
      return valueRef.current;
    },
  });
  const [editor, setEditor] = useState<EditorState>({ value, cursor: countGraphemes(value) });
  const current: EditorState =
    editor.value === value ? editor : { value, cursor: countGraphemes(value) };
  const editorRef = useRef<EditorState>(current);
  editorRef.current = current;

  useInput(
    function handleTextAreaKey(input, key) {
      const previous = editorRef.current;
      const next = applyKeyToMultilineEditor(previous, input, key);
      editorRef.current = next;
      setEditor(next);
      if (next.value !== previous.value) {
        reportInput(next.value);
        field.setValue(next.value);
        validation.clearError();
      }
    },
    { isActive: focusable.isFocused && !isStreaming },
  );

  const rows = typeof props.rows === "number" && props.rows > 0 ? props.rows : DEFAULT_ROWS;
  return (
    <FieldFrame boxRef={focusable.ref} isFocused={focusable.isFocused} column>
      <TextAreaLines
        value={value}
        cursor={current.cursor}
        rows={rows}
        isFocused={focusable.isFocused}
        placeholder={displayText(props.placeholder)}
        styles={styles}
      />
    </FieldFrame>
  );
}

export const TextArea = defineComponent({
  name: "TextArea",
  props: TextAreaSchema,
  description: "",
  component: TextAreaRenderer,
});
