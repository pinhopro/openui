import { Text, useInput } from "ink";
import { useRef, useState } from "react";
import type { z } from "zod/v4";
import { useIsStreaming } from "../context";
import { useFocusable } from "../focus/use-focusable";
import { defineComponent, type ComponentRenderProps } from "../library";
import { InputSchema } from "../schemas/input-schema";
import { useFieldValidation } from "../use-field-validation";
import { useStateField } from "../use-state-field";
import { displayText } from "./pad";
import {
  applyKeyToEditor,
  countGraphemes,
  maskValue,
  splitForCursor,
  type EditorState,
} from "./text-editing";

type InputProps = z.infer<typeof InputSchema>;

const PASSWORD_MASK = "*";

/** The model-facing `Input`: a focusable single-line editor bound to the store. */
function InputRenderer({ props }: ComponentRenderProps<InputProps>) {
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
  // A value the editor did not produce (declared default, initialState, @Set, @Reset)
  // moves the cursor to the end.
  const current: EditorState =
    editor.value === value ? editor : { value, cursor: countGraphemes(value) };
  // Several keys can arrive in one stdin chunk before React re-renders, so the
  // handler works from the latest state, not from the rendered closure.
  const editorRef = useRef<EditorState>(current);
  editorRef.current = current;
  const canType = focusable.isFocused && !isStreaming;

  useInput(
    function handleInputKey(input, key) {
      const previous = editorRef.current;
      const next = applyKeyToEditor(previous, input, key);
      editorRef.current = next;
      setEditor(next);
      if (next.value !== previous.value) {
        field.setValue(next.value);
        validation.clearError();
      }
    },
    { isActive: canType },
  );

  const shown = props.type === "password" ? maskValue(value, PASSWORD_MASK) : value;
  const placeholder = props.placeholder ?? "";

  if (!focusable.isFocused) {
    if (shown === "") {
      return (
        <Text>
          {"  "}
          <Text dimColor>{placeholder}</Text>
        </Text>
      );
    }
    return <Text>{"  " + shown}</Text>;
  }

  if (shown === "") {
    return (
      <Text>
        {"> "}
        <Text inverse> </Text>
        <Text dimColor>{placeholder}</Text>
      </Text>
    );
  }

  const split = splitForCursor(shown, current.cursor);
  return (
    <Text>
      {"> " + split.before}
      <Text inverse>{split.at}</Text>
      {split.after}
    </Text>
  );
}

export const Input = defineComponent({
  name: "Input",
  props: InputSchema,
  description: "",
  component: InputRenderer,
});
