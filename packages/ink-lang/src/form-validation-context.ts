import { validate, type ParsedRule } from "@openuidev/lang-core";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

/** What a Form provides to its fields and buttons. */
export interface FormValidationContextValue {
  /** Current error message per field name. */
  errors: Record<string, string | undefined>;
  getFieldError: (name: string) => string | undefined;
  /** Validates one field and records its error; returns true when valid. */
  validateField: (name: string, value: unknown, rules: ParsedRule[]) => boolean;
  /** Fields register so validateForm can read their current value. */
  registerField: (name: string, rules: ParsedRule[], getValue: () => unknown) => void;
  unregisterField: (name: string) => void;
  /** Validates every registered field; returns true when all are valid. */
  validateForm: () => boolean;
  clearFieldError: (name: string) => void;
}

export const FormValidationContext = createContext<FormValidationContextValue | null>(null);

/** The nearest Form's validation, or null outside a Form. */
export function useFormValidation(): FormValidationContextValue | null {
  return useContext(FormValidationContext);
}

interface FieldRegistration {
  rules: ParsedRule[];
  getValue: () => unknown;
}

/** The value a field stores may be a `{ value, componentType }` wrapper. */
function unwrapForValidation(value: unknown): unknown {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  if ("value" in record && "componentType" in record) return record["value"];
  return value;
}

/** The validation state a Form owns. Same contract as react-lang's useCreateFormValidation. */
export function useCreateFormValidation(): FormValidationContextValue {
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const errorsRef = useRef(errors);
  errorsRef.current = errors;
  const fieldsRef = useRef<Record<string, FieldRegistration>>({});

  const getFieldError = useCallback(function getFieldError(name: string) {
    return errorsRef.current[name];
  }, []);

  const validateField = useCallback(function validateField(
    name: string,
    value: unknown,
    rules: ParsedRule[],
  ): boolean {
    const error = validate(unwrapForValidation(value), rules);
    setErrors(function updateError(previous) {
      if (previous[name] === error) return previous;
      return { ...previous, [name]: error };
    });
    return error === undefined;
  }, []);

  const registerField = useCallback(function registerField(
    name: string,
    rules: ParsedRule[],
    getValue: () => unknown,
  ) {
    fieldsRef.current[name] = { rules, getValue };
  }, []);

  const unregisterField = useCallback(function unregisterField(name: string) {
    delete fieldsRef.current[name];
  }, []);

  const validateForm = useCallback(function validateForm(): boolean {
    let allValid = true;
    const nextErrors: Record<string, string | undefined> = {};
    for (const [name, registration] of Object.entries(fieldsRef.current)) {
      const value = unwrapForValidation(registration.getValue());
      const error = validate(value, registration.rules);
      nextErrors[name] = error;
      if (error !== undefined) allValid = false;
    }
    setErrors(nextErrors);
    return allValid;
  }, []);

  const clearFieldError = useCallback(function clearFieldError(name: string) {
    setErrors(function clearError(previous) {
      if (previous[name] === undefined) return previous;
      return { ...previous, [name]: undefined };
    });
  }, []);

  return useMemo<FormValidationContextValue>(
    function buildValue() {
      return {
        errors,
        getFieldError,
        validateField,
        registerField,
        unregisterField,
        validateForm,
        clearFieldError,
      };
    },
    [
      errors,
      getFieldError,
      validateField,
      registerField,
      unregisterField,
      validateForm,
      clearFieldError,
    ],
  );
}
