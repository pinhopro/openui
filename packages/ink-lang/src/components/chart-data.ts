import { isElementValue } from "../element-node";

/** One category of a 2D chart with the value of every series at that category. */
export interface SeriesRow {
  category: string;
  values: Record<string, number>;
}

/** One slice of a 1D chart. */
export interface ChartSlice {
  category: string;
  value: number;
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Tabular rows: labels are column names, each row's first cell is the category. */
function rowsFromTable(labels: string[], rows: unknown[]): SeriesRow[] {
  const names = labels.slice(1);
  const result: SeriesRow[] = [];
  for (const row of rows) {
    const cells = asArray(row);
    const values: Record<string, number> = {};
    for (let index = 0; index < names.length; index += 1) {
      const name = names[index];
      if (name === undefined) continue;
      values[name] = toNumber(cells[index + 1]);
    }
    result.push({ category: String(cells[0] ?? ""), values });
  }
  return result;
}

/** Series elements: each carries a category name and one value per label. */
function rowsFromSeries(labels: string[], series: unknown[]): SeriesRow[] {
  const result: SeriesRow[] = [];
  for (let index = 0; index < labels.length; index += 1) {
    const values: Record<string, number> = {};
    for (const item of series) {
      if (!isElementValue(item)) continue;
      const name = item.props["category"];
      const seriesValues = item.props["values"];
      if (typeof name !== "string" || !Array.isArray(seriesValues)) continue;
      if (index >= seriesValues.length) continue;
      values[name] = toNumber(seriesValues[index]);
    }
    result.push({ category: labels[index] ?? "", values });
  }
  return result;
}

/** Mirrors react-ui's buildChartData: Series elements, or tabular rows from a Query. */
export function buildSeriesRows(labels: unknown, series: unknown): SeriesRow[] {
  const labelList: string[] = [];
  for (const label of asArray(labels)) labelList.push(String(label));
  const items = asArray(series);
  if (items.length > 0 && Array.isArray(items[0])) return rowsFromTable(labelList, items);
  return rowsFromSeries(labelList, items);
}

/** Every series name in the rows, in first-seen order. */
export function seriesNames(rows: SeriesRow[]): string[] {
  const names: string[] = [];
  for (const row of rows) {
    for (const name of Object.keys(row.values)) {
      if (!names.includes(name)) names.push(name);
    }
  }
  return names;
}

/** Mirrors react-ui's 1D charts: labels plus values, or legacy Slice elements in the labels slot. */
export function buildSlices(labels: unknown, values: unknown): ChartSlice[] {
  const labelList = asArray(labels);
  const valueList = asArray(values);
  const slices: ChartSlice[] = [];
  if (valueList.length > 0) {
    for (let index = 0; index < labelList.length; index += 1) {
      slices.push({ category: String(labelList[index]), value: toNumber(valueList[index]) });
    }
    return slices;
  }
  for (const item of labelList) {
    if (!isElementValue(item)) continue;
    const category = item.props["category"];
    if (typeof category !== "string") continue;
    slices.push({ category, value: toNumber(item.props["value"]) });
  }
  return slices;
}
