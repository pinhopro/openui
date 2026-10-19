import type { Key } from "ink";

/**
 * Ctrl, Meta, Super or Hyper held: the arrow belongs to something else (Ctrl+arrows
 * move a dialog), never to a component's own step. Shift does not count.
 */
function isModified(key: Key): boolean {
  return key.ctrl || key.meta || key.super || key.hyper;
}

/**
 * -1 for Left, 1 for Right, 0 for any other key, a modified arrow
 * (`isModified`) or a kitty release event.
 */
export function horizontalStep(key: Key): number {
  if (key.eventType === "release" || isModified(key)) return 0;
  if (key.leftArrow) return -1;
  if (key.rightArrow) return 1;
  return 0;
}

/**
 * -1 for Up, 1 for Down, 0 for any other key, a modified arrow
 * (`isModified`) or a kitty release event.
 */
export function verticalStep(key: Key): number {
  if (key.eventType === "release" || isModified(key)) return 0;
  if (key.upArrow) return -1;
  if (key.downArrow) return 1;
  return 0;
}
