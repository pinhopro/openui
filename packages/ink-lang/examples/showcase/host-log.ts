import type { ActionEvent, OpenUIError } from "@openuidev/lang-core";

/** One line for the status bar: the action type, its message and any params. */
export function describeAction(event: ActionEvent): string {
  const base = `${event.type} "${event.humanFriendlyMessage}"`;
  const params = event.params ?? {};
  const keys = Object.keys(params);
  if (keys.length === 0) return base;
  return base + " " + JSON.stringify(params);
}

/** The store snapshot as compact JSON. */
export function describeState(state: Record<string, unknown>): string {
  return JSON.stringify(state);
}

/** The error list as `source/code: message` pairs, or an empty string when there is none. */
export function describeErrors(errors: OpenUIError[]): string {
  const parts: string[] = [];
  for (const error of errors) {
    parts.push(`${error.source}/${error.code}: ${error.message}`);
  }
  return parts.join("; ");
}

/** Cuts `text` to `width` cells, ending with an ellipsis when something was dropped. */
export function fitLine(text: string, width: number): string {
  if (width <= 0) return "";
  const characters = Array.from(text);
  if (characters.length <= width) return text;
  const kept = characters.slice(0, width - 1);
  return kept.join("") + "…";
}
