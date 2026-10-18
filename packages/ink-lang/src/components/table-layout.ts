import { isElementValue } from "../element-node";
import { countGraphemes } from "./text-editing";

export type TableAlign = "left" | "right";

export interface TableColumn {
  label: string;
  align: TableAlign;
  /** Cells of the widest label or text cell, at least one. */
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

function columnWidth(label: string, cells: unknown[]): number {
  let width = Math.max(1, countGraphemes(label));
  for (const cell of cells) {
    const text = cellText(cell);
    if (text === null) continue;
    const cellWidth = countGraphemes(text);
    if (cellWidth > width) width = cellWidth;
  }
  return width;
}

/** Measures the Col elements of a Table: one entry per column, widths and the row count. */
export function tableLayout(columns: unknown[]): TableLayout {
  const result: TableColumn[] = [];
  let rowCount = 0;
  for (const column of columns) {
    if (!isElementValue(column)) continue;
    const label = cellText(column.props["label"]) ?? "";
    const cells = asCells(column.props["data"]);
    const align: TableAlign = column.props["type"] === "number" ? "right" : "left";
    result.push({ label, align, width: columnWidth(label, cells), cells });
    if (cells.length > rowCount) rowCount = cells.length;
  }
  return { columns: result, rowCount };
}
