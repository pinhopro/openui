import type { Key } from "ink";

/** Enter or Space presses a button. Kitty-protocol release events never do. */
export function isPressKey(input: string, key: Key): boolean {
  if (key.eventType === "release") return false;
  return key.return || input === " ";
}
