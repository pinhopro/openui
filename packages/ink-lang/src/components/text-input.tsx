import { parseStructuredRules } from "@openuidev/lang-core";
import { Box, Text, useInput, type DOMElement } from "ink";
import { useEffect, useMemo, useRef, useState } from "react";
import type { z } from "zod/v4";
import { useIsStreaming } from "../context";
import { useFocusable } from "../focus/use-focusable";
import { useFormValidation } from "../form-validation-context";
import { defineComponent, type ComponentRenderProps } from "../library";
import { useMouse } from "../mouse/use-mouse";
import { InputSchema } from "../schemas/input-schema";
import { useStateField } from "../use-state-field";
import {
  applyKeyToEditor,
  countGraphemes,
  maskValue,
  splitForCursor,
  type EditorState,
} from "./text-editing";

type InputProps = z.infer<typeof InputSchema>;

const PASSWORD_MASK = "*";

function fieldText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

/** The model-facing `Input`: a focusable single-line editor bound to the store. */
function InputRenderer({ props }: ComponentRenderProps<InputProps>) {
  const isStreaming = useIsStreaming();
  const formValidation = useFormValidation();
  const field = useStateField<unknown>(props.name, props.value);
  const focusable = useFocusable({ isActive: !isStreaming });
  const value = fieldText(field.value);
  const rules = useMemo(
    function parseRules() {
      return parseStructuredRules(props.rules);
    },
    [props.rules],
  );
  const hasRules = rules.length > 0;
  const fieldName = field.name;
  const valueRef = useRef(value);
  valueRef.current = value;

  // Register with the form so a primary button can validate every field.
  useEffect(
    function registerWithForm() {
      if (isStreaming || !hasRules || formValidation === null) return undefined;
      formValidation.registerField(fieldName, rules, function readValue() {
        return valueRef.current;
      });
      return function unregister() {
        formValidation.unregisterField(fieldName);
      };
    },
    [fieldName, formValidation, hasRules, isStreaming, rules],
  );

  // Validate when focus leaves the field; clear the error when it comes back.
  const wasFocusedRef = useRef(focusable.isFocused);
  useEffect(
    function validateOnBlur() {
      const wasFocused = wasFocusedRef.current;
      wasFocusedRef.current = focusable.isFocused;
      if (formValidation === null || !hasRules) return;
      if (wasFocused && !focusable.isFocused) {
        formValidation.validateField(fieldName, valueRef.current, rules);
      }
      if (!wasFocused && focusable.isFocused) {
        formValidation.clearFieldError(fieldName);
      }
    },
    [fieldName, focusable.isFocused, formValidation, hasRules, rules],
  );
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
        if (hasRules) formValidation?.clearFieldError(fieldName);
      }
    },
    { isActive: canType },
  );

  // A click on the line focuses the field, like Tab.
  const boxRef = useRef<DOMElement | null>(null);
  useMouse(boxRef, {
    onClick: function handleClick() {
      if (!isStreaming) focusable.focus();
    },
  });

  const shown = props.type === "password" ? maskValue(value, PASSWORD_MASK) : value;
  const placeholder = props.placeholder ?? "";
  return (
    <Box ref={boxRef}>{inputLine(focusable.isFocused, shown, placeholder, current.cursor)}</Box>
  );
}

/** The one line of the editor: placeholder or value, with a block cursor while focused. */
function inputLine(isFocused: boolean, shown: string, placeholder: string, cursor: number) {
  if (!isFocused) {
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

  const split = splitForCursor(shown, cursor);
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
