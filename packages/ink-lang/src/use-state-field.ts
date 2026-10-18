import { resolveStateField, type StateField } from "@openuidev/lang-core";
import { useOpenUI } from "./context";
import { useFormName } from "./form-name-context";

/**
 * The value and setter of a field. A `$binding` prop gives a two-way field on
 * the bound variable; any other value is a form field stored under the form.
 */
export function useStateField<T = unknown>(name: string, value?: unknown): StateField<T> {
  const context = useOpenUI();
  const formName = useFormName();

  function getField(fieldName: string): unknown {
    return context.getFieldValue(formName, fieldName);
  }

  function setField(fieldName: string, nextValue: unknown): void {
    context.setFieldValue(formName, undefined, fieldName, nextValue);
  }

  return resolveStateField<T>(
    name,
    value,
    context.store,
    context.evaluationContext,
    getField,
    setField,
  );
}
