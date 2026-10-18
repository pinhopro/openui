import { Box, Text, useInput } from "ink";
import { useRef, useState, type ReactNode } from "react";
import type { z } from "zod/v4";
import { useIsStreaming } from "../context";
import { useFocusable } from "../focus/use-focusable";
import { defineComponent, type ComponentRenderProps } from "../library";
import { TextAreaSchema } from "../schemas/text-area-schema";
import { useFieldValidation } from "../use-field-validation";
import { useStateField } from "../use-state-field";
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
}

/** The text split into lines, padded to `rows`, with the cursor on its line while focused. */
function TextAreaLines({ value, cursor, rows, isFocused, placeholder }: TextAreaLinesProps) {
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
        <Text key={index}>
          {prefix + split.before}
          <Text inverse>{split.at}</Text>
          {split.after}
          {value === "" ? <Text dimColor>{placeholder}</Text> : null}
        </Text>,
      );
      continue;
    }
    if (index === 0 && value === "") {
      rendered.push(
        <Text key={index}>
          {prefix}
          <Text dimColor>{placeholder}</Text>
        </Text>,
      );
      continue;
    }
    rendered.push(<Text key={index}>{prefix + (line === "" ? " " : line)}</Text>);
  }
  return <Box flexDirection="column">{rendered}</Box>;
}

/** The model-facing `TextArea`: a focusable multi-line editor bound to the store. */
function TextAreaRenderer({ props }: ComponentRenderProps<TextAreaProps>) {
  const isStreaming = useIsStreaming();
  const field = useStateField<unknown>(props.name, props.value);
  const focusable = useFocusable({ isActive: !isStreaming });
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
        field.setValue(next.value);
        validation.clearError();
      }
    },
    { isActive: focusable.isFocused && !isStreaming },
  );

  const rows = typeof props.rows === "number" && props.rows > 0 ? props.rows : DEFAULT_ROWS;
  return (
    <TextAreaLines
      value={value}
      cursor={current.cursor}
      rows={rows}
      isFocused={focusable.isFocused}
      placeholder={displayText(props.placeholder)}
    />
  );
}

export const TextArea = defineComponent({
  name: "TextArea",
  props: TextAreaSchema,
  description: "",
  component: TextAreaRenderer,
});
