import { parseStructuredRules } from "@openuidev/lang-core";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFormValidation } from "./form-validation-context";

export interface FieldRules {
  /** True when the program gave the field at least one rule. */
  hasRules: boolean;
  /** Drops the field's error after an edit; a no-op without rules or outside a form. */
  clearError: () => void;
}

/**
 * Wires a field's `rules` prop to the surrounding form: registers the field so a
 * primary button can validate it, validates when focus leaves it and clears the
 * error when focus comes back. `valueRef` must always hold the latest value.
 */
export function useFieldRules(
  fieldName: string,
  rulesProp: unknown,
  valueRef: RefObject<unknown>,
  isFocused: boolean,
  isStreaming: boolean,
): FieldRules {
  const formValidation = useFormValidation();
  const rules = useMemo(
    function parseRules() {
      return parseStructuredRules(rulesProp);
    },
    [rulesProp],
  );
  const hasRules = rules.length > 0;

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
    [fieldName, formValidation, hasRules, isStreaming, rules, valueRef],
  );

  // Validate when focus leaves the field; clear the error when it comes back.
  const wasFocusedRef = useRef(isFocused);
  useEffect(
    function validateOnBlur() {
      const wasFocused = wasFocusedRef.current;
      wasFocusedRef.current = isFocused;
      if (formValidation === null || !hasRules) return;
      if (wasFocused && !isFocused) {
        formValidation.validateField(fieldName, valueRef.current, rules);
      }
      if (!wasFocused && isFocused) {
        formValidation.clearFieldError(fieldName);
      }
    },
    [fieldName, formValidation, hasRules, isFocused, rules, valueRef],
  );

  function clearError(): void {
    if (hasRules) formValidation?.clearFieldError(fieldName);
  }

  return { hasRules, clearError };
}
