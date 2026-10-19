import type { ElementNode } from "@openuidev/lang-core";
import { COMBOBOX_PLACEHOLDER } from "./combobox-options";
import { iconText } from "./icon";
import { displayText } from "./pad";
import { SELECT_PLACEHOLDER, selectOptions } from "./select-options";
import { countGraphemes } from "./text-editing";

/** The width a component of no known shape gets in a table column. */
const DEFAULT_ELEMENT_WIDTH = 20;

/** The `> ` or two-space prompt every field starts its line with. */
const PROMPT_WIDTH = 2;

/** The block cursor an editor draws after its text while focused. */
const CURSOR_WIDTH = 1;

/** The `> ▾ ` a Select shows before its picked label; a Combobox option line's `  ● `. */
const MARKED_PROMPT_WIDTH = 4;

/** The components drawn inside a field frame (border and padding from the cascade). */
const FIELD_TYPES = ["Input", "Combobox", "Select", "TextArea", "DatePicker"];

/**
 * Reads what a field shows right now: `name` is the field's name and
 * `declared` its `value` prop, which may be a `$binding` rather than text.
 */
export type FieldValueReader = (name: string, declared: unknown) => unknown;

/** The reader of a renderer with no store: the declared value is what the field shows. */
export function declaredFieldValue(_name: string, declared: unknown): unknown {
  return declared;
}

/** True for a component drawn inside a field frame, so its frame width counts too. */
export function isFieldElement(element: ElementNode): boolean {
  return FIELD_TYPES.includes(element.typeName);
}

function currentValue(props: Record<string, unknown>, readField: FieldValueReader): string {
  return displayText(readField(displayText(props["name"]), props["value"]));
}

/**
 * The cells an editor line takes: the prompt, then the longer of its value
 * and its placeholder (the one shows while the other is hidden, and the user
 * can clear or extend the value), then the cursor the focused editor draws.
 */
function editorWidth(props: Record<string, unknown>, readField: FieldValueReader): number {
  const value = countGraphemes(currentValue(props, readField));
  const placeholder = countGraphemes(displayText(props["placeholder"]));
  return PROMPT_WIDTH + Math.max(value, placeholder) + CURSOR_WIDTH;
}

function widestLabel(items: unknown): number {
  let widest = 0;
  for (const option of selectOptions(items)) {
    const width = countGraphemes(option.label);
    if (width > widest) widest = width;
  }
  return widest;
}

/** `> ▾ ` then the picked label or the placeholder, whichever of all the labels is widest. */
function selectWidth(props: Record<string, unknown>): number {
  const placeholder = countGraphemes(displayText(props["placeholder"] ?? SELECT_PLACEHOLDER));
  return MARKED_PROMPT_WIDTH + Math.max(widestLabel(props["items"]), placeholder);
}

/** The wider of the filter line (`> `, cursor, placeholder) and an option line (`  ● label`). */
function comboboxWidth(props: Record<string, unknown>): number {
  const placeholder = countGraphemes(displayText(props["placeholder"] ?? COMBOBOX_PLACEHOLDER));
  const filterLine = PROMPT_WIDTH + CURSOR_WIDTH + placeholder;
  const optionLine = MARKED_PROMPT_WIDTH + widestLabel(props["items"]);
  return Math.max(filterLine, optionLine);
}

/**
 * How many cells an element will take on one line, estimated from its
 * props the way its renderer draws it: `[ label ]` for a button, the prompt,
 * text and cursor for a field, `[text]` for a tag, the text for text blocks.
 * Anything else takes a fixed width. `readField` resolves what a field shows
 * right now, so a column follows the value as the user types.
 */
export function elementWidth(
  element: ElementNode,
  readField: FieldValueReader = declaredFieldValue,
): number {
  const props = element.props;
  const type = element.typeName;
  if (type === "Button") return 4 + countGraphemes(displayText(props["label"]));
  if (type === "IconButton") {
    const icon = iconText(props["icon"]);
    const name = displayText(props["name"]);
    return 4 + countGraphemes(icon === "" ? name : icon + " " + name);
  }
  if (type === "Input" || type === "TextArea") return editorWidth(props, readField);
  if (type === "Select") return selectWidth(props);
  if (type === "Combobox") return comboboxWidth(props);
  if (type === "DatePicker") return PROMPT_WIDTH + "YYYY-MM-DD".length;
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
