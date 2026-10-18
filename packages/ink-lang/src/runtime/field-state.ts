import type { Store } from "@openuidev/lang-core";

/**
 * Form fields are stored as `{ value, componentType }` wrappers, nested under
 * the form name. Page-level fields (no form) are top-level wrappers. This is the
 * layout react-lang uses, so `onStateUpdate` payloads are interchangeable.
 */
export interface FieldWrapper {
  value: unknown;
  componentType: string | undefined;
}

/** Returns the value inside a field wrapper; anything else passes through. */
export function unwrapFieldValue(value: unknown): unknown {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  if ("value" in record) return record["value"];
  return value;
}

/** react-lang treats an empty form name as "no form"; so does this runtime. */
function normalizeFormName(formName: string | undefined): string | undefined {
  if (formName === undefined || formName === "") return undefined;
  return formName;
}

function readForm(store: Store, formName: string): Record<string, unknown> | undefined {
  const raw = store.get(formName);
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return undefined;
  return raw as Record<string, unknown>;
}

export function getFieldValue(
  store: Store,
  rawFormName: string | undefined,
  name: string,
): unknown {
  const formName = normalizeFormName(rawFormName);
  if (formName === undefined) return unwrapFieldValue(store.get(name));
  const form = readForm(store, formName);
  if (form === undefined) return undefined;
  return unwrapFieldValue(form[name]);
}

export function setFieldValue(
  store: Store,
  rawFormName: string | undefined,
  componentType: string | undefined,
  name: string,
  value: unknown,
): void {
  const formName = normalizeFormName(rawFormName);
  const wrapped: FieldWrapper = { value, componentType };
  if (formName === undefined) {
    store.set(name, wrapped);
    return;
  }
  const existing = readForm(store, formName) ?? {};
  const next: Record<string, unknown> = { ...existing, [name]: wrapped };
  store.set(formName, next);
}

/** The form state delivered with an ActionEvent: the named form, else the whole store. */
export function getFormPayload(
  store: Store,
  rawFormName: string | undefined,
): Record<string, unknown> {
  const formName = normalizeFormName(rawFormName);
  if (formName !== undefined) {
    const form = readForm(store, formName);
    if (form !== undefined) return { [formName]: form };
  }
  return store.getSnapshot();
}
