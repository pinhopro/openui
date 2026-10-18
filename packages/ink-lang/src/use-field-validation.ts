import { parseStructuredRules, type ParsedRule } from "@openuidev/lang-core";
import { useEffect, useMemo, useRef } from "react";
import { useIsStreaming } from "./context";
import { useFormValidation } from "./form-validation-context";

export interface FieldValidationOptions {
  /** The field name under the form. */
  fieldName: string;
  /** The component's `rules` prop as the model wrote it. */
  rules: unknown;
  /** Whether the component has focus; validation runs when focus leaves. */
  isFocused: boolean;
  /** The current value, read when the form validates every field. */
  getValue: () => unknown;
}

export interface FieldValidation {
  hasRules: boolean;
  rules: ParsedRule[];
  /** Validates one value now (after an edit that should report immediately). */
  validate: (value: unknown) => void;
  /** Clears the field's error (after an edit that fixes it). */
  clearError: () => void;
}

/**
 * What every input shares with the form it sits in: registering so a primary
 * button can validate every field, validating when focus leaves the field and
 * clearing the error when focus returns. Outside a Form, or without rules, it
 * does nothing.
 */
export function useFieldValidation(options: FieldValidationOptions): FieldValidation {
  const { fieldName, isFocused } = options;
  const isStreaming = useIsStreaming();
  const formValidation = useFormValidation();
  const rules = useMemo(
    function parseRules() {
      return parseStructuredRules(options.rules);
    },
    [options.rules],
  );
  const hasRules = rules.length > 0;
  const getValueRef = useRef(options.getValue);
  getValueRef.current = options.getValue;

  useEffect(
    function registerWithForm() {
      if (isStreaming || !hasRules || formValidation === null) return undefined;
      formValidation.registerField(fieldName, rules, function readValue() {
        return getValueRef.current();
      });
      return function unregister() {
        formValidation.unregisterField(fieldName);
      };
    },
    [fieldName, formValidation, hasRules, isStreaming, rules],
  );

  const wasFocusedRef = useRef(isFocused);
  useEffect(
    function validateOnBlur() {
      const wasFocused = wasFocusedRef.current;
      wasFocusedRef.current = isFocused;
      if (formValidation === null || !hasRules) return;
      if (wasFocused && !isFocused) {
        formValidation.validateField(fieldName, getValueRef.current(), rules);
      }
      if (!wasFocused && isFocused) {
        formValidation.clearFieldError(fieldName);
      }
    },
    [fieldName, formValidation, hasRules, isFocused, rules],
  );

  function validate(value: unknown): void {
    if (formValidation === null || !hasRules) return;
    formValidation.validateField(fieldName, value, rules);
  }

  function clearError(): void {
    if (formValidation === null || !hasRules) return;
    formValidation.clearFieldError(fieldName);
  }

  return { hasRules, rules, validate, clearError };
}
