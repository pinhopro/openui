import { Box, Text } from "ink";
import type { ReactNode } from "react";
import { useTheme } from "../theme";
import { AxisLabels } from "./axis-labels";
import { buildSeriesRows, seriesNames, type SeriesRow } from "./chart-data";
import { barCells, formatNumber, padEnd } from "./chart-text";

const BAR_WIDTH = 20;

export interface SeriesBarsProps {
  labels: unknown;
  series: unknown;
  xLabel: string | undefined;
  yLabel: string | undefined;
}

function maxValue(rows: SeriesRow[]): number {
  let max = 0;
  for (const row of rows) {
    for (const value of Object.values(row.values)) {
      if (value > max) max = value;
    }
  }
  return max;
}

function widest(texts: string[]): number {
  let width = 0;
  for (const text of texts) {
    if (text.length > width) width = text.length;
  }
  return width;
}

/** Horizontal text bars: one bar per label and series, with the value at the end. */
export function SeriesBars({ labels, series, xLabel, yLabel }: SeriesBarsProps) {
  const theme = useTheme();
  const rows = buildSeriesRows(labels, series);
  const names = seriesNames(rows);
  if (rows.length === 0 || names.length === 0) return null;
  const max = maxValue(rows);
  const labelWidth = widest(rows.map(categoryOf));
  const nameWidth = names.length > 1 ? widest(names) : 0;
  const lines: ReactNode[] = [];
  for (const row of rows) {
    for (const name of names) {
      const value = row.values[name];
      if (value === undefined) continue;
      const cells = barCells(value, max, BAR_WIDTH);
      const prefix = padEnd(row.category, labelWidth);
      const seriesPrefix = names.length > 1 ? ` ${padEnd(name, nameWidth)}` : "";
      lines.push(
        <Text key={`${row.category}:${name}`}>
          {prefix}
          <Text dimColor>{seriesPrefix}</Text> <Text color={theme.accent}>{"█".repeat(cells)}</Text>{" "}
          {formatNumber(value)}
        </Text>,
      );
    }
  }
  return (
    <Box flexDirection="column">
      {lines}
      <AxisLabels xLabel={xLabel} yLabel={yLabel} />
    </Box>
  );
}

function categoryOf(row: SeriesRow): string {
  return row.category;
}
