import type { Key } from "ink";

/** -1 for Left, 1 for Right, 0 for any other key or a kitty release event. */
export function horizontalStep(key: Key): number {
  if (key.eventType === "release") return 0;
  if (key.leftArrow) return -1;
  if (key.rightArrow) return 1;
  return 0;
}

/** -1 for Up, 1 for Down, 0 for any other key or a kitty release event. */
export function verticalStep(key: Key): number {
  if (key.eventType === "release") return 0;
  if (key.upArrow) return -1;
  if (key.downArrow) return 1;
  return 0;
}
