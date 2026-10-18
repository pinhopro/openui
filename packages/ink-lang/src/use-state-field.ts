import { resolveStateField, type StateField } from "@openuidev/lang-core";
import { useOpenUI } from "./context";
import { useElementType } from "./element-type-context";
import { useFormName } from "./form-name-context";
import { useUiEvents } from "./ui-events";

/**
 * The value and setter of a field. A `$binding` prop gives a two-way field on
 * the bound variable; any other value is a form field stored under the form.
 * Every write is reported to the host as a `change` UI event.
 */
export function useStateField<T = unknown>(name: string, value?: unknown): StateField<T> {
  const context = useOpenUI();
  const formName = useFormName();
  const component = useElementType();
  const emit = useUiEvents();

  function getField(fieldName: string): unknown {
    return context.getFieldValue(formName, fieldName);
  }

  function setField(fieldName: string, nextValue: unknown): void {
    context.setFieldValue(formName, undefined, fieldName, nextValue);
  }

  const field = resolveStateField<T>(
    name,
    value,
    context.store,
    context.evaluationContext,
    getField,
    setField,
  );
  const setValue = field.setValue;

  function setValueAndReport(nextValue: T): void {
    setValue(nextValue);
    emit({ type: "change", component, name: field.name, value: nextValue });
  }

  return { ...field, setValue: setValueAndReport };
}
