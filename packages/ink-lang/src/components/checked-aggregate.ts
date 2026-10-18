import type { ElementNode } from "@openuidev/lang-core";
import { isElementValue } from "../element-node";
import { displayText } from "./pad";

/** A CheckBoxItem or SwitchItem as the group reads it. */
export interface CheckedItem {
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}

/** The item elements of a CheckBoxGroup or SwitchGroup; anything else the model wrote is skipped. */
export function checkedItems(items: unknown): CheckedItem[] {
  const result: CheckedItem[] = [];
  if (!Array.isArray(items)) return result;
  for (const item of items) {
    if (!isElementValue(item)) continue;
    const element = item as ElementNode;
    const name = displayText(element.props["name"]);
    if (name === "") continue;
    result.push({
      name,
      label: displayText(element.props["label"]),
      description: displayText(element.props["description"]),
      defaultChecked: element.props["defaultChecked"] === true,
    });
  }
  return result;
}

/** One boolean per item: the stored value when present, else the item's default. */
export function checkedAggregate(items: CheckedItem[], stored: unknown): Record<string, boolean> {
  const record =
    typeof stored === "object" && stored !== null && !Array.isArray(stored)
      ? (stored as Record<string, unknown>)
      : {};
  const aggregate: Record<string, boolean> = {};
  for (const item of items) {
    const value = record[item.name];
    aggregate[item.name] = typeof value === "boolean" ? value : item.defaultChecked;
  }
  return aggregate;
}
