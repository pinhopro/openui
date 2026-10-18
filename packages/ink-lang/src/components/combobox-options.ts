import type { SelectOption } from "./select-options";

/** The slice of a long list that fits on screen, and how many rows follow it. */
export interface ListWindow {
  start: number;
  end: number;
  hiddenAfter: number;
}

/** The options whose label or value contains the query, ignoring case and surrounding spaces. */
export function filterOptions(options: SelectOption[], query: string): SelectOption[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") return options;
  const matches: SelectOption[] = [];
  for (const option of options) {
    const label = option.label.toLowerCase();
    const value = option.value.toLowerCase();
    if (label.includes(needle) || value.includes(needle)) matches.push(option);
  }
  return matches;
}

/** Up to `size` rows around the cursor: the list scrolls once the cursor passes the last row. */
export function listWindow(count: number, cursor: number, size: number): ListWindow {
  if (count <= 0 || size <= 0) return { start: 0, end: 0, hiddenAfter: 0 };
  let start = 0;
  if (cursor >= size) start = cursor - size + 1;
  const end = Math.min(count, start + size);
  return { start, end, hiddenAfter: count - end };
}
