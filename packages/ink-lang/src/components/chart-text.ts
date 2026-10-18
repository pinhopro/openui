const SPARK_GLYPHS = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];

/** How many cells of a bar a value fills; a non-zero value always shows at least one cell. */
export function barCells(value: number, max: number, width: number): number {
  if (max <= 0 || value <= 0 || width <= 0) return 0;
  const cells = Math.round((value / max) * width);
  if (cells === 0) return 1;
  return Math.min(width, cells);
}

/** One block glyph per value, scaled between the minimum and maximum of the series. */
export function sparkline(values: number[]): string {
  if (values.length === 0) return "";
  let min = Infinity;
  let max = -Infinity;
  for (const value of values) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  let line = "";
  for (const value of values) {
    const index = max === min ? 3 : Math.round(((value - min) / (max - min)) * 7);
    line += SPARK_GLYPHS[index] ?? SPARK_GLYPHS[0];
  }
  return line;
}

/** Each value's share of the total, in whole percents. */
export function percentages(values: number[]): number[] {
  let total = 0;
  for (const value of values) total += Math.max(0, value);
  const shares: number[] = [];
  for (const value of values) {
    shares.push(total <= 0 ? 0 : Math.round((Math.max(0, value) / total) * 100));
  }
  return shares;
}

/** Splits `width` cells between the values proportionally; non-empty slices keep one cell. */
export function proportionSegments(values: number[], width: number): number[] {
  let total = 0;
  for (const value of values) total += Math.max(0, value);
  const cells: number[] = [];
  if (total <= 0 || width <= 0) {
    for (let index = 0; index < values.length; index += 1) cells.push(0);
    return cells;
  }
  const fractions: number[] = [];
  let used = 0;
  for (const value of values) {
    const share = Math.max(0, value) / total;
    let whole = Math.floor(share * width);
    if (value > 0 && whole === 0) whole = 1;
    cells.push(whole);
    fractions.push(share * width - whole);
    used += whole;
  }
  // Hand the leftover cells to the largest remainders, or take back from the largest slices.
  while (used < width) {
    const index = indexOfLargest(fractions);
    if (index === -1) break;
    cells[index] = (cells[index] ?? 0) + 1;
    fractions[index] = -1;
    used += 1;
  }
  while (used > width) {
    const index = indexOfLargest(cells, 2);
    if (index === -1) break;
    cells[index] = (cells[index] ?? 0) - 1;
    used -= 1;
  }
  return cells;
}

function indexOfLargest(values: number[], atLeast = -Infinity): number {
  let best = -1;
  let bestValue = -Infinity;
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index] ?? -Infinity;
    if (value >= atLeast && value > bestValue) {
      bestValue = value;
      best = index;
    }
  }
  return best;
}

/** Integers as they are, decimals rounded to two places. */
export function formatNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 100) / 100);
}

/** Pads text on the right so a column lines up. */
export function padEnd(text: string, width: number): string {
  if (text.length >= width) return text;
  return text + " ".repeat(width - text.length);
}
