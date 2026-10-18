import { countGraphemes } from "./text-editing";

/** Pads `text` on the right with spaces up to `width` user-perceived characters. */
export function padEnd(text: string, width: number): string {
  const missing = width - countGraphemes(text);
  if (missing <= 0) return text;
  return text + " ".repeat(missing);
}

/** Pads `text` on the left with spaces up to `width` user-perceived characters. */
export function padStart(text: string, width: number): string {
  const missing = width - countGraphemes(text);
  if (missing <= 0) return text;
  return " ".repeat(missing) + text;
}

/** The widest text of the list, in user-perceived characters. */
export function widestText(texts: string[]): number {
  let width = 0;
  for (const text of texts) {
    const count = countGraphemes(text);
    if (count > width) width = count;
  }
  return width;
}

/** Any value as display text; null and undefined become the empty string. */
export function displayText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return String(value);
}
