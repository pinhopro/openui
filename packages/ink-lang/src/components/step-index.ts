/** Keeps an index inside a list of `count` items; zero for an empty list. */
export function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  if (index < 0) return 0;
  if (index > count - 1) return count - 1;
  return index;
}

/** Moves an index by `delta`, stopping at both ends instead of wrapping. */
export function stepIndex(index: number, count: number, delta: number): number {
  return clampIndex(index + delta, count);
}
