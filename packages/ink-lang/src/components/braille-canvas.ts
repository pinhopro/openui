/**
 * A grid of terminal cells where every cell is a 2 x 4 matrix of braille dots
 * (U+2800 block). Dot coordinates run from the top-left: x across
 * `width * 2` columns, y down `height * 4` rows.
 */
export interface BrailleCanvas {
  /** Cells across. */
  width: number;
  /** Cells down. */
  height: number;
  /** One dot bitmask per cell, row-major. */
  cells: Uint8Array;
}

const BRAILLE_BASE = 0x2800;

/** Bit of each dot, indexed [column][row], as the braille block lays them out. */
const DOT_BITS: number[][] = [
  [0x01, 0x02, 0x04, 0x40],
  [0x08, 0x10, 0x20, 0x80],
];

export function createBrailleCanvas(width: number, height: number): BrailleCanvas {
  const cellCount = Math.max(0, width) * Math.max(0, height);
  return {
    width: Math.max(0, width),
    height: Math.max(0, height),
    cells: new Uint8Array(cellCount),
  };
}

/** Dot columns of the canvas. */
export function dotColumns(canvas: BrailleCanvas): number {
  return canvas.width * 2;
}

/** Dot rows of the canvas. */
export function dotRows(canvas: BrailleCanvas): number {
  return canvas.height * 4;
}

/** Lights one dot; dots outside the canvas are ignored. */
export function plot(canvas: BrailleCanvas, x: number, y: number): void {
  const column = Math.round(x);
  const row = Math.round(y);
  if (column < 0 || row < 0) return;
  if (column >= dotColumns(canvas) || row >= dotRows(canvas)) return;
  const cellIndex = Math.floor(row / 4) * canvas.width + Math.floor(column / 2);
  const bit = DOT_BITS[column % 2]?.[row % 4] ?? 0;
  canvas.cells[cellIndex] = (canvas.cells[cellIndex] ?? 0) | bit;
}

/** Lights every dot on the straight line between two dots (Bresenham). */
export function plotLine(
  canvas: BrailleCanvas,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): void {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const endX = Math.round(x1);
  const endY = Math.round(y1);
  const deltaX = Math.abs(endX - x);
  const deltaY = -Math.abs(endY - y);
  const stepX = x < endX ? 1 : -1;
  const stepY = y < endY ? 1 : -1;
  let error = deltaX + deltaY;
  for (;;) {
    plot(canvas, x, y);
    if (x === endX && y === endY) break;
    const doubled = 2 * error;
    if (doubled >= deltaY) {
      error += deltaY;
      x += stepX;
    }
    if (doubled <= deltaX) {
      error += deltaX;
      y += stepY;
    }
  }
}

/** Lights a dot and every dot below it in the same column (area fill). */
export function fillBelow(canvas: BrailleCanvas, x: number, y: number): void {
  const bottom = dotRows(canvas) - 1;
  for (let row = Math.max(0, Math.round(y)); row <= bottom; row += 1) plot(canvas, x, row);
}

/** One string per cell row; an unlit cell is the blank braille pattern. */
export function toLines(canvas: BrailleCanvas): string[] {
  const lines: string[] = [];
  for (let row = 0; row < canvas.height; row += 1) {
    let line = "";
    for (let column = 0; column < canvas.width; column += 1) {
      const bits = canvas.cells[row * canvas.width + column] ?? 0;
      line += String.fromCharCode(BRAILLE_BASE + bits);
    }
    lines.push(line);
  }
  return lines;
}

/** Maps a value in [min, max] onto a dot index in [0, dots - 1]; a flat range sits in the middle. */
export function projectValue(value: number, min: number, max: number, dots: number): number {
  const last = Math.max(0, dots - 1);
  if (max <= min) return Math.floor(last / 2);
  const ratio = (value - min) / (max - min);
  const index = Math.round(ratio * last);
  if (index < 0) return 0;
  if (index > last) return last;
  return index;
}

/** Fills the area under a segment: every dot column between the ends, from the line down. */
export function plotArea(
  canvas: BrailleCanvas,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): void {
  const startX = Math.round(Math.min(x0, x1));
  const endX = Math.round(Math.max(x0, x1));
  const leftY = x0 <= x1 ? y0 : y1;
  const rightY = x0 <= x1 ? y1 : y0;
  for (let x = startX; x <= endX; x += 1) {
    const ratio = endX === startX ? 0 : (x - startX) / (endX - startX);
    const y = leftY + (rightY - leftY) * ratio;
    fillBelow(canvas, x, y);
  }
}
