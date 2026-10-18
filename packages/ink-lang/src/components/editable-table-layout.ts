import { displayText, widestText } from "./pad";
import type { SelectOption } from "./select-options";

export type EditableColumnType = "text" | "number" | "date-single" | "select" | "url";

export interface EditableColumn {
  type: EditableColumnType;
  key: string;
  header: string;
  options: SelectOption[];
}

export interface EditableRow {
  id: string;
  values: unknown[];
}

const COLUMN_TYPES: EditableColumnType[] = ["text", "number", "date-single", "select", "url"];

function toColumnType(value: unknown): EditableColumnType {
  for (const type of COLUMN_TYPES) {
    if (value === type) return type;
  }
  return "text";
}

function toOptions(value: unknown): SelectOption[] {
  const options: SelectOption[] = [];
  if (!Array.isArray(value)) return options;
  for (const raw of value) {
    if (typeof raw !== "object" || raw === null) continue;
    const record = raw as Record<string, unknown>;
    options.push({ value: displayText(record["value"]), label: displayText(record["label"]) });
  }
  return options;
}

/** The column definitions of an EditableTable; malformed entries are skipped. */
export function editableColumns(columns: unknown): EditableColumn[] {
  const result: EditableColumn[] = [];
  if (!Array.isArray(columns)) return result;
  for (const raw of columns) {
    if (typeof raw !== "object" || raw === null) continue;
    const record = raw as Record<string, unknown>;
    result.push({
      type: toColumnType(record["type"]),
      key: displayText(record["key"]),
      header: displayText(record["header"]),
      options: toOptions(record["options"]),
    });
  }
  return result;
}

/** The rows of an EditableTable; malformed entries are skipped. */
export function editableRows(data: unknown): EditableRow[] {
  const result: EditableRow[] = [];
  if (!Array.isArray(data)) return result;
  for (const raw of data) {
    if (typeof raw !== "object" || raw === null) continue;
    const record = raw as Record<string, unknown>;
    const values = Array.isArray(record["values"]) ? [...(record["values"] as unknown[])] : [];
    result.push({ id: displayText(record["id"]), values });
  }
  return result;
}

/** What a cell shows: the option label for select columns, the value as text otherwise. */
export function cellLabel(column: EditableColumn, value: unknown): string {
  const text = displayText(value);
  if (column.type !== "select") return text;
  for (const option of column.options) {
    if (option.value === text) return option.label;
  }
  return text;
}

/** Column widths: the widest of the header and every cell label, at least one cell. */
export function editableColumnWidths(columns: EditableColumn[], rows: EditableRow[]): number[] {
  const widths: number[] = [];
  for (let index = 0; index < columns.length; index += 1) {
    const column = columns[index] as EditableColumn;
    const texts: string[] = [column.header];
    for (const row of rows) texts.push(cellLabel(column, row.values[index]));
    widths.push(Math.max(1, widestText(texts)));
  }
  return widths;
}

/** The option `delta` places after the current one, stopping at both ends. */
export function nextOptionValue(
  column: EditableColumn,
  value: unknown,
  delta: number,
): string | undefined {
  const count = column.options.length;
  if (count === 0) return undefined;
  const text = displayText(value);
  let index = -1;
  for (let position = 0; position < count; position += 1) {
    if (column.options[position]?.value === text) index = position;
  }
  let next = index + delta;
  if (next < 0) next = 0;
  if (next > count - 1) next = count - 1;
  return column.options[next]?.value;
}

/** The value to store for typed text: a number for number columns when it parses. */
export function parseCellInput(column: EditableColumn, text: string): string | number {
  if (column.type !== "number") return text;
  const trimmed = text.trim();
  if (trimmed === "") return text;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : text;
}

/** A copy of the rows with one cell replaced. */
export function withCellValue(
  rows: EditableRow[],
  rowIndex: number,
  columnIndex: number,
  value: unknown,
): EditableRow[] {
  const next: EditableRow[] = [];
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index] as EditableRow;
    if (index !== rowIndex) {
      next.push(row);
      continue;
    }
    const values = [...row.values];
    values[columnIndex] = value;
    next.push({ id: row.id, values });
  }
  return next;
}
