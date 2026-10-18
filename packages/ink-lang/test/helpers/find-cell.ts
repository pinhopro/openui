export interface Cell {
  x: number;
  y: number;
}

/** The 0-based cell where `text` starts in a plain (ANSI-free) frame; throws when absent. */
export function findCell(frame: string, text: string): Cell {
  const lines = frame.split("\n");
  for (let y = 0; y < lines.length; y += 1) {
    const line = lines[y] ?? "";
    const x = line.indexOf(text);
    if (x !== -1) return { x, y };
  }
  throw new Error(`"${text}" is not in the frame:\n${frame}`);
}

/** The 0-based cell `offset` cells to the right of where `text` starts. */
export function cellAfter(frame: string, text: string, offset: number): Cell {
  const cell = findCell(frame, text);
  return { x: cell.x + offset, y: cell.y };
}
