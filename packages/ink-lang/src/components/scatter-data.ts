import { isElementValue } from "../element-node";

export interface ScatterPoint {
  x: number;
  y: number;
}

/** One ScatterSeries: its name and its points, in program order. */
export interface ScatterDataset {
  name: string;
  points: ScatterPoint[];
}

function readProps(value: unknown): Record<string, unknown> | null {
  if (isElementValue(value)) return value.props;
  if (typeof value === "object" && value !== null) return value as Record<string, unknown>;
  return null;
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** ScatterSeries elements (or plain objects) to datasets; a dataset without points is dropped. */
export function readScatterDatasets(datasets: unknown): ScatterDataset[] {
  const list = Array.isArray(datasets) ? datasets : [];
  const result: ScatterDataset[] = [];
  for (const dataset of list) {
    const props = readProps(dataset);
    if (props === null) continue;
    const rawPoints = Array.isArray(props["points"]) ? props["points"] : [];
    const points: ScatterPoint[] = [];
    for (const point of rawPoints) {
      const pointProps = readProps(point);
      if (pointProps === null) continue;
      points.push({ x: toNumber(pointProps["x"]), y: toNumber(pointProps["y"]) });
    }
    if (points.length === 0) continue;
    result.push({ name: typeof props["name"] === "string" ? props["name"] : "", points });
  }
  return result;
}
