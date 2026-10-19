/**
 * The text of base row `index` (1-based): a label then a run of `=` to 90
 * cells, wide enough that a centred dialog painted over it hides part of it.
 */
export function fillerText(index: number): string {
  const label = `base row ${String(index).padStart(2, "0")} `;
  return label + "=".repeat(90 - label.length);
}

/**
 * `count` TextContent rows for a program's root Stack, joined by commas: a
 * page tall enough for a floating dialog to be drawn whole over it.
 */
export function fillerRows(count: number): string {
  const rows: string[] = [];
  for (let index = 1; index <= count; index += 1) {
    rows.push(`TextContent("${fillerText(index)}")`);
  }
  return rows.join(", ");
}

/** How many of the first `count` filler rows show whole in a plain frame. */
export function wholeFillerRows(frame: string, count: number): number {
  let whole = 0;
  for (let index = 1; index <= count; index += 1) {
    if (frame.includes(fillerText(index))) whole += 1;
  }
  return whole;
}
