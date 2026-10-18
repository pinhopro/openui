import { displayText, widestText } from "./pad";

export interface EntityRow {
  left: string;
  right: string;
  isNumber: boolean;
}

export interface EntityListLayout {
  rows: EntityRow[];
  header: EntityRow | undefined;
  footer: EntityRow | undefined;
  leftWidth: number;
  rightWidth: number;
}

function toRow(value: unknown): EntityRow | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const record = value as Record<string, unknown>;
  return {
    left: displayText(record["left"]),
    right: displayText(record["right"]),
    isNumber: record["rightVariant"] === "number",
  };
}

/** The rows of an EntityList with the column widths they share; small lists drop header and footer. */
export function entityListLayout(
  rawRows: unknown,
  size: unknown,
  rawHeader: unknown,
  rawFooter: unknown,
): EntityListLayout {
  const rows: EntityRow[] = [];
  if (Array.isArray(rawRows)) {
    for (const raw of rawRows) {
      const row = toRow(raw);
      if (row !== undefined) rows.push(row);
    }
  }
  const isSmall = size === "small";
  const header = isSmall ? undefined : toRow(rawHeader);
  const footer = isSmall ? undefined : toRow(rawFooter);
  const all: EntityRow[] = [...rows];
  if (header !== undefined) all.push(header);
  if (footer !== undefined) all.push(footer);
  const lefts: string[] = [];
  const rights: string[] = [];
  for (const row of all) {
    lefts.push(row.left);
    rights.push(row.right);
  }
  return { rows, header, footer, leftWidth: widestText(lefts), rightWidth: widestText(rights) };
}
