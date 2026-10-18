import {
  createBrailleCanvas,
  dotColumns,
  dotRows,
  plotArea,
  plotLine,
  projectValue,
  toLines,
} from "./braille-canvas";
import { BraillePlot } from "./braille-plot";
import { buildSeriesRows, seriesNames } from "./chart-data";

export interface BrailleSeriesChartProps {
  labels: unknown;
  series: unknown;
  xLabel: string | undefined;
  yLabel: string | undefined;
  /** True fills the area under every line (AreaChart). */
  filled: boolean;
}

/** Cells across and down: wide enough for a trend, short enough to leave room for the rest. */
const CANVAS_WIDTH = 40;
const CANVAS_HEIGHT = 5;
const LINE_MARK = "──";
const AREA_MARK = "▆▆";

interface SeriesPoint {
  index: number;
  value: number;
}

/** LineChart and AreaChart: one braille polyline per series on a shared canvas. */
export function BrailleSeriesChart({
  labels,
  series,
  xLabel,
  yLabel,
  filled,
}: BrailleSeriesChartProps) {
  const rows = buildSeriesRows(labels, series);
  const names = seriesNames(rows);
  if (rows.length === 0 || names.length === 0) return null;
  const pointsByName: SeriesPoint[][] = [];
  let min = Infinity;
  let max = -Infinity;
  for (const name of names) {
    const points: SeriesPoint[] = [];
    for (let index = 0; index < rows.length; index += 1) {
      const value = rows[index]?.values[name];
      if (value === undefined) continue;
      points.push({ index, value });
      if (value < min) min = value;
      if (value > max) max = value;
    }
    pointsByName.push(points);
  }
  if (min === Infinity) return null;
  const canvas = createBrailleCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  const columns = dotColumns(canvas);
  const lastRow = dotRows(canvas) - 1;
  for (const points of pointsByName) {
    let previousX = -1;
    let previousY = -1;
    for (const point of points) {
      const x = projectValue(point.index, 0, rows.length - 1, columns);
      const y = lastRow - projectValue(point.value, min, max, lastRow + 1);
      if (previousX === -1) {
        if (filled) plotArea(canvas, x, y, x, y);
        else plotLine(canvas, x, y, x, y);
      } else if (filled) {
        plotArea(canvas, previousX, previousY, x, y);
      } else {
        plotLine(canvas, previousX, previousY, x, y);
      }
      previousX = x;
      previousY = y;
    }
  }
  const legend: string[] = [];
  for (const name of names) legend.push((filled ? AREA_MARK : LINE_MARK) + " " + name);
  return (
    <BraillePlot
      lines={toLines(canvas)}
      yMin={min}
      yMax={max}
      xFirst={rows[0]?.category ?? ""}
      xLast={rows[rows.length - 1]?.category ?? ""}
      legend={legend}
      xLabel={xLabel}
      yLabel={yLabel}
    />
  );
}
