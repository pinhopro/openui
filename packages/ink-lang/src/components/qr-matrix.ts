import qrcode from "qrcode-generator";

export type QrBlockSize = "compact" | "large";

/** The dark modules of a QR code, row by row, with `quiet` empty modules around. */
export function qrMatrix(data: string, quiet: number): boolean[][] {
  const code = qrcode(0, "M");
  code.addData(data);
  code.make();
  const count = code.getModuleCount();
  const size = count + quiet * 2;
  const rows: boolean[][] = [];
  for (let row = 0; row < size; row += 1) {
    const cells: boolean[] = [];
    for (let column = 0; column < size; column += 1) {
      const inner =
        row >= quiet && row < quiet + count && column >= quiet && column < quiet + count;
      cells.push(inner ? code.isDark(row - quiet, column - quiet) : false);
    }
    rows.push(cells);
  }
  return rows;
}

const FULL = "█";
const UPPER = "▀";
const LOWER = "▄";
const EMPTY = " ";

/**
 * The matrix as text lines: `compact` packs two module rows into one line
 * with half blocks (a cell is about twice as tall as wide), `large` draws
 * one module as two full-block cells on its own line.
 */
export function qrBlockLines(matrix: boolean[][], size: QrBlockSize): string[] {
  const lines: string[] = [];
  if (size === "large") {
    for (const row of matrix) {
      let line = "";
      for (const dark of row) line += dark ? FULL + FULL : EMPTY + EMPTY;
      lines.push(line);
    }
    return lines;
  }
  for (let row = 0; row < matrix.length; row += 2) {
    const upper = matrix[row] as boolean[];
    const lower = matrix[row + 1];
    let line = "";
    for (let column = 0; column < upper.length; column += 1) {
      const top = upper[column] === true;
      const bottom = lower === undefined ? false : lower[column] === true;
      if (top && bottom) line += FULL;
      else if (top) line += UPPER;
      else if (bottom) line += LOWER;
      else line += EMPTY;
    }
    lines.push(line);
  }
  return lines;
}
