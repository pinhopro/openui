import { Box, Text } from "ink";
import type { ReactNode } from "react";
import type { z } from "zod/v4";
import { isElementValue } from "../element-node";
import { defineComponent, type ComponentRenderProps } from "../library";
import { ScatterChartSchema } from "../schemas/scatter-chart-schema";
import { AxisLabels } from "./axis-labels";
import { formatNumber } from "./chart-text";

type ScatterChartProps = z.infer<typeof ScatterChartSchema>;

interface DatasetSummary {
  name: string;
  count: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
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

/** Points, counts and ranges per dataset; a scatter plot has no faithful text shape. */
export function summarizeDatasets(datasets: unknown): DatasetSummary[] {
  const list = Array.isArray(datasets) ? datasets : [];
  const summaries: DatasetSummary[] = [];
  for (const dataset of list) {
    const props = readProps(dataset);
    if (props === null) continue;
    const points = Array.isArray(props["points"]) ? props["points"] : [];
    const summary: DatasetSummary = {
      name: typeof props["name"] === "string" ? props["name"] : "",
      count: 0,
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity,
    };
    for (const point of points) {
      const pointProps = readProps(point);
      if (pointProps === null) continue;
      const x = toNumber(pointProps["x"]);
      const y = toNumber(pointProps["y"]);
      summary.count += 1;
      summary.minX = Math.min(summary.minX, x);
      summary.maxX = Math.max(summary.maxX, x);
      summary.minY = Math.min(summary.minY, y);
      summary.maxY = Math.max(summary.maxY, y);
    }
    if (summary.count > 0) summaries.push(summary);
  }
  return summaries;
}

function ScatterChartRenderer({ props }: ComponentRenderProps<ScatterChartProps>) {
  const summaries = summarizeDatasets(props.datasets);
  if (summaries.length === 0) return null;
  const lines: ReactNode[] = [];
  for (const summary of summaries) {
    const pointWord = summary.count === 1 ? "point" : "points";
    lines.push(
      <Text key={summary.name}>
        <Text bold>{summary.name}</Text>: {summary.count} {pointWord}, x{" "}
        {formatNumber(summary.minX)}
        ..{formatNumber(summary.maxX)}, y {formatNumber(summary.minY)}..{formatNumber(summary.maxY)}
      </Text>,
    );
  }
  return (
    <Box flexDirection="column">
      {lines}
      <AxisLabels xLabel={props.xLabel} yLabel={props.yLabel} />
    </Box>
  );
}

export const ScatterChart = defineComponent({
  name: "ScatterChart",
  props: ScatterChartSchema,
  description: "X/Y scatter plot; use for correlations, distributions, and clustering",
  component: ScatterChartRenderer,
});
