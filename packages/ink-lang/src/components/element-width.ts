import type { ElementNode } from "@openuidev/lang-core";
import { iconText } from "./icon";
import { displayText } from "./pad";
import { countGraphemes } from "./text-editing";

/** The width a component of no known shape gets in a table column. */
const DEFAULT_ELEMENT_WIDTH = 20;

/** The components drawn inside a field frame (border and padding from the cascade). */
const FIELD_TYPES = ["Input", "Combobox", "Select", "TextArea", "DatePicker"];

/** True for a component drawn inside a field frame, so its frame width counts too. */
export function isFieldElement(element: ElementNode): boolean {
  return FIELD_TYPES.includes(element.typeName);
}

/** The cells the text of a field takes: the two-cell prefix plus the value or placeholder. */
function fieldWidth(props: Record<string, unknown>): number {
  const value = displayText(props["value"]);
  const placeholder = displayText(props["placeholder"]);
  const shown = value === "" ? placeholder : value;
  return 2 + countGraphemes(shown);
}

/**
 * How many cells an element will take on one line, estimated from its
 * props the way its renderer draws it: `[ label ]` for a button, the prefix
 * and placeholder for a field, `[text]` for a tag, the text for text blocks.
 * Anything else takes a fixed width.
 */
export function elementWidth(element: ElementNode): number {
  const props = element.props;
  const type = element.typeName;
  if (type === "Button") return 4 + countGraphemes(displayText(props["label"]));
  if (type === "IconButton") {
    const icon = iconText(props["icon"]);
    const name = displayText(props["name"]);
    return 4 + countGraphemes(icon === "" ? name : icon + " " + name);
  }
  if (type === "Input" || type === "Combobox" || type === "Select") return fieldWidth(props);
  if (type === "TextArea") return fieldWidth(props);
  if (type === "DatePicker") return 2 + "YYYY-MM-DD".length;
  if (type === "Tag") return 2 + countGraphemes(displayText(props["text"])) + iconWidth(props);
  if (type === "Icon") return countGraphemes(iconText(element));
  if (type === "TextContent" || type === "Label") return countGraphemes(displayText(props["text"]));
  if (type === "Text" || type === "BoldText") return countGraphemes(displayText(props["value"]));
  return DEFAULT_ELEMENT_WIDTH;
}

function iconWidth(props: Record<string, unknown>): number {
  const icon = iconText(props["icon"]);
  return icon === "" ? 0 : countGraphemes(icon) + 1;
}
