import { resolveStateField } from "@openuidev/lang-core";
import { useOpenUI } from "../context";
import { useFormName } from "../form-name-context";
import type { FieldValueReader } from "./element-width";

function ignoreWrite(): void {}

/**
 * Reads what a field inside this table shows right now, resolved the way the
 * field itself does: a `$binding` from the store, any other field from the
 * enclosing form (or the page), falling back to the declared value.
 */
export function useFieldValueReader(): FieldValueReader {
  const context = useOpenUI();
  const formName = useFormName();
  return function readField(name, declared) {
    function getField(fieldName: string): unknown {
      return context.getFieldValue(formName, fieldName);
    }
    const field = resolveStateField(
      name,
      declared,
      context.store,
      context.evaluationContext,
      getField,
      ignoreWrite,
    );
    return field.value;
  };
}
