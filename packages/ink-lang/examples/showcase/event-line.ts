import type { UiEvent } from "../../src/ui-events";

/** One line of the event log: `click Button "Go" @4,2 left`, `change Input "q" = "ab"`. */
export function describeUiEvent(event: UiEvent): string {
  const parts: string[] = [event.type];
  if (event.component !== "") parts.push(event.component);
  if (event.name !== "") parts.push(JSON.stringify(event.name));
  if (event.x !== undefined && event.y !== undefined) parts.push(`@${event.x},${event.y}`);
  if (event.button !== undefined && event.type !== "wheel") parts.push(event.button);
  if (event.direction !== undefined) parts.push(event.direction);
  if (event.ticks !== undefined) parts.push(`x${event.ticks}`);
  if (event.key !== undefined) parts.push(`key=${event.key}`);
  if (event.type === "input" || event.type === "change") {
    parts.push("=");
    parts.push(JSON.stringify(event.value));
  }
  return parts.join(" ");
}
