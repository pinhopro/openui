import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { ScatterChartSchema } from "../schemas/scatter-chart-schema";
import {
  createBrailleCanvas,
  dotColumns,
  dotRows,
  plot,
  projectValue,
  toLines,
} from "./braille-canvas";
import { BraillePlot } from "./braille-plot";
import { formatNumber } from "./chart-text";
import { readScatterDatasets } from "./scatter-data";

type ScatterChartProps = z.infer<typeof ScatterChartSchema>;

const CANVAS_WIDTH = 40;
const CANVAS_HEIGHT = 6;
const POINT_MARK = "••";

/** Every dataset's points on one braille canvas, with a legend line per dataset. */
function ScatterChartRenderer({ props }: ComponentRenderProps<ScatterChartProps>) {
  const datasets = readScatterDatasets(props.datasets);
  if (datasets.length === 0) return null;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const dataset of datasets) {
    for (const point of dataset.points) {
      if (point.x < minX) minX = point.x;
      if (point.x > maxX) maxX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.y > maxY) maxY = point.y;
    }
  }
  const canvas = createBrailleCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  const columns = dotColumns(canvas);
  const lastRow = dotRows(canvas) - 1;
  const legend: string[] = [];
  for (const dataset of datasets) {
    for (const point of dataset.points) {
      const x = projectValue(point.x, minX, maxX, columns);
      const y = lastRow - projectValue(point.y, minY, maxY, lastRow + 1);
      plot(canvas, x, y);
    }
    const count = dataset.points.length;
    const pointWord = count === 1 ? "point" : "points";
    legend.push(POINT_MARK + " " + dataset.name + " (" + String(count) + " " + pointWord + ")");
  }
  return (
    <BraillePlot
      lines={toLines(canvas)}
      yMin={minY}
      yMax={maxY}
      xFirst={formatNumber(minX)}
      xLast={formatNumber(maxX)}
      legend={legend}
      xLabel={props.xLabel}
      yLabel={props.yLabel}
    />
  );
}

export const ScatterChart = defineComponent({
  name: "ScatterChart",
  props: ScatterChartSchema,
  description: "X/Y scatter plot; use for correlations, distributions, and clustering",
  component: ScatterChartRenderer,
});
