import type { Key } from "ink";

const NAMED_KEYS: Array<[keyof Key, string]> = [
  ["tab", "Tab"],
  ["return", "Enter"],
  ["escape", "Escape"],
  ["backspace", "Backspace"],
  ["delete", "Delete"],
  ["upArrow", "ArrowUp"],
  ["downArrow", "ArrowDown"],
  ["leftArrow", "ArrowLeft"],
  ["rightArrow", "ArrowRight"],
  ["pageUp", "PageUp"],
  ["pageDown", "PageDown"],
  ["home", "Home"],
  ["end", "End"],
];

/**
 * A browser-like name for a key press: `Tab`, `ArrowUp`, `a`, `Space`, with
 * `ctrl+`, `alt+`, `shift+` and `super+` prefixes for the modifiers.
 */
export function keyName(input: string, key: Key): string {
  let base = "";
  for (const [flag, name] of NAMED_KEYS) {
    if (key[flag] === true) {
      base = name;
      break;
    }
  }
  if (base === "") base = input === " " ? "Space" : input;
  const parts: string[] = [];
  if (key.ctrl) parts.push("ctrl");
  if (key.meta) parts.push("alt");
  if (key.super) parts.push("super");
  if (key.shift && base.length > 1) parts.push("shift");
  parts.push(base);
  return parts.join("+");
}
