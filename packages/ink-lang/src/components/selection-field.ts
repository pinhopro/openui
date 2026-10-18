import type { ElementNode } from "@openuidev/lang-core";
import { isElementValue } from "../element-node";
import { displayText } from "./pad";

export type SelectionType = "single" | "multiple";

/** A ChipItem or OptionCard as its group reads it. */
export interface SelectionItem {
  value: string;
  label: string;
  subtitle: string;
  icon: unknown;
  topContent: unknown;
  disabled: boolean;
}

/** The item elements of a Chips or OptionCards group; items without a value are skipped. */
export function selectionItems(items: unknown): SelectionItem[] {
  const result: SelectionItem[] = [];
  if (!Array.isArray(items)) return result;
  for (const item of items) {
    if (!isElementValue(item)) continue;
    const element = item as ElementNode;
    const value = displayText(element.props["value"]);
    if (value === "") continue;
    const label = element.props["label"] ?? element.props["title"];
    result.push({
      value,
      label: displayText(label),
      subtitle: displayText(element.props["subtitle"]),
      icon: element.props["icon"],
      topContent: element.props["topContent"],
      disabled: element.props["disabled"] === true,
    });
  }
  return result;
}

function onlyStrings(values: unknown[]): string[] {
  const strings: string[] = [];
  for (const value of values) {
    if (typeof value === "string") strings.push(value);
  }
  return strings;
}

function firstString(value: unknown): string[] {
  if (typeof value === "string") return value === "" ? [] : [value];
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0] === "" ? [] : [value[0]];
  }
  return [];
}

/**
 * The selected values: the stored value when present, else the default. Port
 * of normalizeSelection in react-ui's selectionFieldUtils.
 */
export function normalizeSelection(
  type: SelectionType,
  storedValue: unknown,
  defaultValue: unknown,
): string[] {
  if (type === "single") {
    const stored = firstString(storedValue);
    if (stored.length > 0 || typeof storedValue === "string" || Array.isArray(storedValue)) {
      return stored;
    }
    return firstString(defaultValue);
  }
  if (Array.isArray(storedValue)) return onlyStrings(storedValue);
  if (typeof storedValue === "string") return storedValue === "" ? [] : [storedValue];
  if (Array.isArray(defaultValue)) return onlyStrings(defaultValue);
  if (typeof defaultValue === "string") return defaultValue === "" ? [] : [defaultValue];
  return [];
}

/** The selection with `itemValue` toggled: single keeps at most one value. */
export function toggleSelection(
  type: SelectionType,
  selection: string[],
  itemValue: string,
): string[] {
  if (type === "single") return selection[0] === itemValue ? [] : [itemValue];
  const next: string[] = [];
  let found = false;
  for (const value of selection) {
    if (value === itemValue) found = true;
    else next.push(value);
  }
  if (!found) next.push(itemValue);
  return next;
}

/** What the store holds for a selection: a string (or undefined) for single, a string[] for multiple. */
export function storedSelection(type: SelectionType, selection: string[]): unknown {
  if (type === "single") return selection[0];
  return selection;
}

/** What validation sees: undefined when nothing is selected, so `required` fails. */
export function selectionForValidation(type: SelectionType, selection: string[]): unknown {
  if (selection.length === 0) return undefined;
  return storedSelection(type, selection);
}
