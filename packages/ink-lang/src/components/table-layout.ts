import { isElementValue } from "../element-node";
import { elementWidth, isFieldElement } from "./element-width";
import { countGraphemes } from "./text-editing";

export type TableAlign = "left" | "right";

export interface TableColumn {
  label: string;
  align: TableAlign;
  /** Cells of the widest label, text cell or estimated element cell, at least one. */
  width: number;
  cells: unknown[];
}

export interface TableLayout {
  columns: TableColumn[];
  rowCount: number;
}

/** The text of a primitive cell; null for an element the caller renders as a node. */
export function cellText(cell: unknown): string | null {
  if (cell === null || cell === undefined) return "";
  if (typeof cell === "string") return cell;
  if (typeof cell === "number" || typeof cell === "boolean") return String(cell);
  if (isElementValue(cell)) return null;
  return "";
}

function asCells(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data === null || data === undefined) return [];
  return [data];
}

/** The cells a cell takes: its text, or the estimate for an element (plus the field frame for a field). */
function cellWidth(cell: unknown, fieldFrameWidth: number): number {
  const text = cellText(cell);
  if (text !== null) return countGraphemes(text);
  if (!isElementValue(cell)) return 0;
  const width = elementWidth(cell);
  return isFieldElement(cell) ? width + fieldFrameWidth : width;
}

function columnWidth(label: string, cells: unknown[], fieldFrameWidth: number): number {
  let width = Math.max(1, countGraphemes(label));
  for (const cell of cells) {
    const measured = cellWidth(cell, fieldFrameWidth);
    if (measured > width) width = measured;
  }
  return width;
}

/**
 * Measures the Col elements of a Table: one entry per column, widths and the
 * row count. `fieldFrameWidth` is what the border and padding of a field add
 * around its text under this table, so a field cell gets a column it fits in.
 */
export function tableLayout(columns: unknown[], fieldFrameWidth = 0): TableLayout {
  const result: TableColumn[] = [];
  let rowCount = 0;
  for (const column of columns) {
    if (!isElementValue(column)) continue;
    const label = cellText(column.props["label"]) ?? "";
    const cells = asCells(column.props["data"]);
    const align: TableAlign = column.props["type"] === "number" ? "right" : "left";
    result.push({ label, align, width: columnWidth(label, cells, fieldFrameWidth), cells });
    if (cells.length > rowCount) rowCount = cells.length;
  }
  return { columns: result, rowCount };
}
